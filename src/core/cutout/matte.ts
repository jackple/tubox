import { type AnyCanvas, type Rect, createCanvas, getCtx } from '../canvas'
import { coreError } from '../errors'

/**
 * 通用抠图蒙版：@imgly/background-removal（ISNet，onnxruntime-web 推理，WebGPU 优先、失败回退 WASM）。
 * 推理只在长边 MATTE_SIZE 的工作图上进行（模型输入固定 1024×1024），合成时由画布插值放大到原图。
 * 可运行在主线程与 Worker 中（见 workers/cutout.worker.ts）。
 */

/** 蒙版工作分辨率（长边），与模型输入一致 */
export const MATTE_SIZE = 1024

export type CutoutStep = 'model' | 'segment' | 'done'

export interface SegmentOptions {
  /** 资源目录（resources.json 所在目录，绝对地址，以 / 结尾） */
  publicPath: string
  model: 'isnet' | 'isnet_fp16' | 'isnet_quint8'
  /** 进度：model 阶段带下载比例（0-1） */
  onProgress?: (step: CutoutStep, ratio?: number) => void
}

export interface RawMatte {
  width: number
  height: number
  /** 前景概率（0-1），width×height */
  prob: Float32Array
}

export interface EdgeOptions {
  /** 边缘收缩（负）/ 扩展（正），单位为工作分辨率下的像素，-10~10 */
  shift: number
  /** 羽化半径，0~10 */
  feather: number
}

export interface Matte {
  /** 白色 + alpha 蒙版，工作分辨率 */
  canvas: AnyCanvas
  /** 主体外接框（蒙版坐标）；未识别到主体时为 null */
  bounds: Rect | null
}

/** 上次初始化失败的次数：imgly 按配置缓存初始化 Promise（含失败），换个键才能重试 */
let attempt = 0
let device: 'gpu' | 'cpu' = 'gpu'

/**
 * 主体分割
 * @param rgba 工作图像素（RGBA），尺寸 width×height
 */
export async function segmentSubject(rgba: Uint8ClampedArray, width: number, height: number, o: SegmentOptions): Promise<RawMatte> {
  const { segmentForeground } = await import('@imgly/background-removal')
  // x-rgba8 为库内置的原始像素格式，省去一次编解码
  const input = new Blob([rgba], { type: `image/x-rgba8;width=${width};height=${height}` })
  const downloads = new Map<string, [number, number]>()
  let segmenting = false

  const run = (dev: typeof device) =>
    segmentForeground(input, {
      publicPath: o.publicPath,
      model: o.model,
      device: dev,
      output: { format: 'image/x-rgba8' },
      fetchArgs: { attempt },
      progress: (key, current, total) => {
        if (key.startsWith('fetch:')) {
          downloads.set(key, [current, total])
          let cur = 0
          let sum = 0
          downloads.forEach(([c, t]) => ((cur += c), (sum += t)))
          o.onProgress?.('model', sum ? cur / sum : 0)
        } else if (key.startsWith('compute:') && !segmenting) {
          segmenting = true
          o.onProgress?.('segment')
        }
      },
    })

  const fail = () => {
    attempt++
    return Promise.reject(coreError(segmenting ? 'segment-failed' : 'model-load-failed'))
  }
  o.onProgress?.('model', 0)
  const out = await run(device).catch(() => {
    if (device === 'cpu') return fail()
    // WebGPU 不可用或建会话失败时回退 WASM（CPU），之后不再尝试 GPU
    device = 'cpu'
    return run(device).catch(fail)
  })

  const px = new Uint8Array(await out.arrayBuffer())
  if (px.length !== width * height * 4) throw coreError('segment-failed')
  const prob = new Float32Array(width * height)
  for (let i = 0; i < prob.length; i++) prob[i] = px[i * 4 + 3] / 255
  o.onProgress?.('done')
  return { width, height, prob }
}

/** 由前景概率生成最终蒙版：收缩 / 扩展 → 羽化 */
export function buildMatte(base: Float32Array, w: number, h: number, o: EdgeOptions): Matte {
  const k = Math.max(w, h) / MATTE_SIZE
  let a = base
  if (o.shift) {
    // 先模糊再移动阈值，边缘即沿法线方向平移
    a = levels(boxBlur(a, w, h, Math.max(1, Math.round(Math.abs(o.shift) * 2 * k))), 0.5 - Math.sign(o.shift) * 0.25, 0.3)
  }
  if (o.feather) {
    const r = Math.max(1, Math.round(o.feather * k))
    a = boxBlur(boxBlur(a, w, h, r), w, h, r)
  }

  const canvas = createCanvas(w, h)
  const ctx = getCtx(canvas)
  const img = ctx.createImageData(w, h)
  const d = img.data
  let x0 = w
  let y0 = h
  let x1 = -1
  let y1 = -1
  let solid = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const o4 = i * 4
      d[o4] = d[o4 + 1] = d[o4 + 2] = 255
      d[o4 + 3] = a[i] * 255
      if (a[i] > 0.5) solid++
      if (a[i] > 0.15) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  ctx.putImageData(img, 0, 0)
  // 实心面积过小视为未识别到主体（零星误检）
  const found = solid > w * h * 0.005
  return { canvas, bounds: found ? { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 } : null }
}

/** smoothstep 收边：center 附近 width 宽度内平滑过渡，两侧压到 0 / 1 */
function levels(src: Float32Array, center: number, width: number): Float32Array {
  const out = new Float32Array(src.length)
  const lo = center - width / 2
  for (let i = 0; i < src.length; i++) {
    const t = Math.min(1, Math.max(0, (src[i] - lo) / width))
    out[i] = t * t * (3 - 2 * t)
  }
  return out
}

/** 均值滤波（可分离的滑动窗口求和，O(N)，边界按实际窗口归一化） */
function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(w * h)
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    const row = y * w
    let sum = 0
    for (let x = 0; x <= Math.min(r, w - 1); x++) sum += src[row + x]
    for (let x = 0; x < w; x++) {
      tmp[row + x] = sum / (Math.min(w - 1, x + r) - Math.max(0, x - r) + 1)
      if (x + r + 1 < w) sum += src[row + x + r + 1]
      if (x - r >= 0) sum -= src[row + x - r]
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0
    for (let y = 0; y <= Math.min(r, h - 1); y++) sum += tmp[y * w + x]
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum / (Math.min(h - 1, y + r) - Math.max(0, y - r) + 1)
      if (y + r + 1 < h) sum += tmp[(y + r + 1) * w + x]
      if (y - r >= 0) sum -= tmp[(y - r) * w + x]
    }
  }
  return out
}
