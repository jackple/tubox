import type { InferenceSession } from 'onnxruntime-web'
import { MAX_CANVAS_AREA } from '../canvas'
import { coreError } from '../errors'

/**
 * AI 高清放大：Real-ESRGAN realesr-general-x4v3（SRVGGNetCompact，约 1.2M 参数，固定 ×4），onnxruntime-web 推理，WebGPU 优先、失败回退 WASM。
 * 大图按块推理（块间重叠，消除接缝）；×2 由 ×4 结果逐块做 2×2 均值缩小得到（与 Real-ESRGAN 的 --outscale 一致）。
 * 透明图：RGB 先把颜色向透明区域外扩（避免边缘黑边）再送入模型，alpha 通道双线性插值放大。
 * 纯像素运算，不依赖 Canvas，运行在 Worker 中（见 workers/upscale.worker.ts）。
 */

/** 模型固有放大倍数 */
const MODEL_SCALE = 4
/** 推理窗口边长与重叠宽度：窗口 = 有效区 + 两侧重叠 */
const TILE = 256
const PAD = 16
/** 输出长边上限（面积另受 MAX_CANVAS_AREA 约束） */
const MAX_OUTPUT_SIDE = 8192
/** 拿不到 Content-Length 时按此估算模型下载进度 */
const MODEL_BYTES = 4_866_420

export type UpscaleScale = 2 | 4
export type UpscaleStep = 'model' | 'upscale'
export type UpscaleBackend = 'webgpu' | 'wasm'

export interface UpscaleAssets {
  /** onnxruntime wasm 所在的 imgly 资源目录（resources.json 所在目录，绝对地址，以 / 结尾） */
  ortPath: string
  /** 模型候选地址（绝对地址），按顺序尝试 */
  model: string[]
}

export interface UpscaleResult {
  width: number
  height: number
  /** RGBA 像素 */
  data: Uint8ClampedArray
  backend: UpscaleBackend
}

export interface UpscalePlan {
  /** 送入模型的输入尺寸（原图过大时先缩小） */
  w: number
  h: number
  /** 输出尺寸 */
  ow: number
  oh: number
  limited: boolean
}

/** 按画布上限规划输入 / 输出尺寸 */
export function planUpscale(w: number, h: number, scale: UpscaleScale): UpscalePlan {
  const k = Math.min(1, MAX_OUTPUT_SIDE / (Math.max(w, h) * scale), Math.sqrt(MAX_CANVAS_AREA / (w * h * scale * scale)))
  const iw = Math.max(1, Math.floor(w * k))
  const ih = Math.max(1, Math.floor(h * k))
  return { w: iw, h: ih, ow: iw * scale, oh: ih * scale, limited: k < 1 }
}

/* ───────── 模型与运行时加载 ───────── */

type Ort = typeof import('onnxruntime-web')

interface Runtime {
  ort: Ort
  session: InferenceSession
  backend: UpscaleBackend
  model: Uint8Array
}

let runtime: Promise<Runtime> | null = null

type Progress = (loaded: number, total: number) => void

async function fetchBytes(url: string, onProgress?: Progress): Promise<Uint8Array> {
  const res = await fetch(url)
  // Vite 开发服务器对不存在的文件会回退 index.html，因此要排除 text/html
  if (!res.ok || (res.headers.get('content-type') ?? '').includes('text/html')) throw new Error(`HTTP ${res.status}: ${url}`)
  const total = Number(res.headers.get('content-length')) || 0
  if (!res.body || !onProgress) return new Uint8Array(await res.arrayBuffer())
  const reader = res.body.getReader()
  const parts: Uint8Array[] = []
  let loaded = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    parts.push(value)
    loaded += value.length
    onProgress(loaded, total)
  }
  const out = new Uint8Array(loaded)
  let offset = 0
  for (const p of parts) (out.set(p, offset), (offset += p.length))
  return out
}

/** imgly 资源按 4MB 分块存放（resources.json 记录分块），拼回完整文件后以 blob URL 交给 onnxruntime */
async function ortFile(dir: string, key: string, onProgress: Progress): Promise<string> {
  const res = await fetch(new URL('resources.json', dir))
  if (!res.ok) throw new Error(`HTTP ${res.status}: resources.json`)
  const entry = ((await res.json()) as Record<string, { mime?: string; chunks: { name: string; offsets: [number, number] }[] }>)[key]
  if (!entry) throw new Error(`missing ${key}`)
  const total = entry.chunks.reduce((n, c) => n + c.offsets[1] - c.offsets[0], 0)
  const loaded = new Map<string, number>()
  const parts = await Promise.all(
    entry.chunks.map((c) =>
      fetchBytes(new URL(c.name, dir).href, (n) => {
        loaded.set(c.name, n)
        let sum = 0
        loaded.forEach((v) => (sum += v))
        onProgress(sum, total)
      }),
    ),
  )
  const type = entry.mime ?? (key.endsWith('.mjs') ? 'text/javascript' : 'application/wasm')
  return URL.createObjectURL(new Blob(parts as BlobPart[], { type }))
}

async function hasWebGpu(): Promise<boolean> {
  const gpu = (globalThis.navigator as { gpu?: { requestAdapter(): Promise<unknown> } } | undefined)?.gpu
  return !!gpu && !!(await gpu.requestAdapter().catch(() => null))
}

const createSession = (ort: Ort, model: Uint8Array, backend: UpscaleBackend) =>
  ort.InferenceSession.create(model, { executionProviders: [backend], graphOptimizationLevel: 'all' })

async function loadRuntime(assets: UpscaleAssets, onProgress: (ratio: number) => void): Promise<Runtime> {
  const gpu = await hasWebGpu()
  // WebGPU 版运行时（jsep）同时支持 webgpu 与 wasm 两种后端，GPU 失败时无需再加载另一套
  const ort: Ort = gpu ? await import('onnxruntime-web/webgpu') : await import('onnxruntime-web')
  const base = gpu ? '/onnxruntime-web/ort-wasm-simd-threaded.jsep' : '/onnxruntime-web/ort-wasm-simd-threaded'

  const progress = new Map<string, [number, number]>([['model', [0, MODEL_BYTES]]])
  const track = (key: string) => (loaded: number, total: number) => {
    progress.set(key, [loaded, total || MODEL_BYTES])
    let cur = 0
    let sum = 0
    progress.forEach(([c, t]) => ((cur += Math.min(c, t)), (sum += t)))
    onProgress(sum ? cur / sum : 0)
  }

  const loadModel = async () => {
    let lastError: unknown
    for (const url of assets.model) {
      try {
        return await fetchBytes(url, track('model'))
      } catch (e) {
        lastError = e
      }
    }
    throw lastError
  }
  const [wasm, mjs, model] = await Promise.all([
    ortFile(assets.ortPath, `${base}.wasm`, track('wasm')),
    ortFile(assets.ortPath, `${base}.mjs`, track('mjs')),
    loadModel(),
  ])
  ort.env.wasm.wasmPaths = { wasm, mjs }
  // 页面未开启跨源隔离时无法使用多线程，显式设为 1 避免告警
  if (!globalThis.crossOriginIsolated) ort.env.wasm.numThreads = 1

  if (gpu) {
    try {
      return { ort, model, backend: 'webgpu', session: await createSession(ort, model, 'webgpu') }
    } catch {
      /* 回退 WASM */
    }
  }
  return { ort, model, backend: 'wasm', session: await createSession(ort, model, 'wasm') }
}

/** 模型会话常驻；加载失败时清空缓存以便重试 */
function getRuntime(assets: UpscaleAssets, onProgress: (ratio: number) => void) {
  runtime ??= loadRuntime(assets, onProgress).catch((e) => {
    runtime = null
    console.error(e)
    return Promise.reject(coreError('model-load-failed'))
  })
  return runtime
}

/* ───────── 推理 ───────── */

interface Tile {
  /** 有效区（输入坐标） */
  x0: number
  y0: number
  x1: number
  y1: number
  /** 推理窗口左上角（窗口尺寸固定，便于 WebGPU 复用同一形状） */
  wx: number
  wy: number
}

function planTiles(w: number, h: number): { tiles: Tile[]; ww: number; wh: number } {
  const ww = Math.min(w, TILE)
  const wh = Math.min(h, TILE)
  const stride = TILE - PAD * 2
  const tiles: Tile[] = []
  for (let y0 = 0; y0 < h; y0 += stride) {
    for (let x0 = 0; x0 < w; x0 += stride) {
      const x1 = Math.min(w, x0 + stride)
      const y1 = Math.min(h, y0 + stride)
      // 窗口向内收，始终完整落在图内且包含有效区
      tiles.push({ x0, y0, x1, y1, wx: Math.max(0, Math.min(x0 - PAD, w - ww)), wy: Math.max(0, Math.min(y0 - PAD, h - wh)) })
    }
  }
  return { tiles, ww, wh }
}

/** 把颜色从不透明像素向全透明区域外扩（多源 BFS，取最近像素的颜色），避免模型把透明处的黑色带进边缘 */
function bleed(src: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray {
  const px = new Uint8ClampedArray(src)
  const n = w * h
  const seen = new Uint8Array(n)
  const queue = new Int32Array(n)
  let head = 0
  let tail = 0
  for (let i = 0; i < n; i++) if (px[i * 4 + 3] > 0) ((seen[i] = 1), (queue[tail++] = i))
  while (head < tail) {
    const i = queue[head++]
    const x = i % w
    const visit = (j: number) => {
      if (seen[j]) return
      seen[j] = 1
      px[j * 4] = px[i * 4]
      px[j * 4 + 1] = px[i * 4 + 1]
      px[j * 4 + 2] = px[i * 4 + 2]
      queue[tail++] = j
    }
    if (x > 0) visit(i - 1)
    if (x < w - 1) visit(i + 1)
    if (i >= w) visit(i - w)
    if (i < n - w) visit(i + w)
  }
  return px
}

/** 双线性采样 alpha（输入坐标） */
function sampleAlpha(src: Uint8ClampedArray, w: number, h: number, fx: number, fy: number): number {
  const x = Math.min(w - 1, Math.max(0, fx))
  const y = Math.min(h - 1, Math.max(0, fy))
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = Math.min(w - 1, x0 + 1)
  const y1 = Math.min(h - 1, y0 + 1)
  const tx = x - x0
  const ty = y - y0
  const a = (xx: number, yy: number) => src[(yy * w + xx) * 4 + 3]
  return (a(x0, y0) * (1 - tx) + a(x1, y0) * tx) * (1 - ty) + (a(x0, y1) * (1 - tx) + a(x1, y1) * tx) * ty
}

/**
 * 放大
 * @param rgba      输入像素（RGBA），尺寸 w×h；应先经 planUpscale 限制尺寸
 * @param cancelled 每块推理前检查，返回 true 时中止
 */
export async function upscalePixels(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  scale: UpscaleScale,
  assets: UpscaleAssets,
  onProgress: (step: UpscaleStep, ratio: number) => void,
  cancelled: () => boolean,
): Promise<UpscaleResult> {
  onProgress('model', 0)
  let rt = await getRuntime(assets, (r) => onProgress('model', r))
  onProgress('upscale', 0)

  let hasAlpha = false
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i] < 255) ((hasAlpha = true), (i = rgba.length))
  const rgb = hasAlpha ? bleed(rgba, w, h) : rgba

  const { tiles, ww, wh } = planTiles(w, h)
  const ow = w * scale
  const oh = h * scale
  const out = new Uint8ClampedArray(ow * oh * 4)
  /** 模型输出相对最终输出的缩小倍数，逐块按 f×f 求均值 */
  const f = MODEL_SCALE / scale
  const plane = ww * wh
  const input = new Float32Array(plane * 3)
  const mw = ww * MODEL_SCALE
  const mPlane = mw * wh * MODEL_SCALE

  const run = async (feed: Float32Array) => {
    const tensor = new rt.ort.Tensor('float32', feed, [1, 3, wh, ww])
    try {
      const res = await rt.session.run({ [rt.session.inputNames[0]]: tensor })
      const o = res[rt.session.outputNames[0]]
      const data = (await o.getData()) as Float32Array
      o.dispose()
      return data
    } finally {
      tensor.dispose()
    }
  }

  for (let t = 0; t < tiles.length; t++) {
    if (cancelled()) throw new Error('cancelled')
    const { x0, y0, x1, y1, wx, wy } = tiles[t]
    for (let y = 0; y < wh; y++) {
      for (let x = 0; x < ww; x++) {
        const s = ((wy + y) * w + wx + x) * 4
        const d = y * ww + x
        input[d] = rgb[s] / 255
        input[d + plane] = rgb[s + 1] / 255
        input[d + plane * 2] = rgb[s + 2] / 255
      }
    }

    let data: Float32Array
    try {
      data = await run(input)
    } catch (e) {
      // WebGPU 推理失败（如显存不足）时改用 WASM 重试，之后不再尝试 GPU
      if (rt.backend !== 'webgpu') throw coreError('upscale-failed')
      console.warn(e)
      const session = await createSession(rt.ort, rt.model, 'wasm').catch(() => Promise.reject(coreError('upscale-failed')))
      rt = { ...rt, session, backend: 'wasm' }
      runtime = Promise.resolve(rt)
      data = await run(input).catch(() => Promise.reject(coreError('upscale-failed')))
    }

    const area = f * f
    for (let oy = y0 * scale; oy < y1 * scale; oy++) {
      const my = (oy - wy * scale) * f
      for (let ox = x0 * scale; ox < x1 * scale; ox++) {
        const mx = (ox - wx * scale) * f
        let r = 0
        let g = 0
        let b = 0
        for (let dy = 0; dy < f; dy++) {
          const row = (my + dy) * mw + mx
          for (let dx = 0; dx < f; dx++) {
            r += data[row + dx]
            g += data[row + dx + mPlane]
            b += data[row + dx + mPlane * 2]
          }
        }
        const o = (oy * ow + ox) * 4
        // 输出可能略超 0-1，Uint8ClampedArray 赋值时自动钳位与取整
        out[o] = (r / area) * 255
        out[o + 1] = (g / area) * 255
        out[o + 2] = (b / area) * 255
        out[o + 3] = hasAlpha ? sampleAlpha(rgba, w, h, (ox + 0.5) / scale - 0.5, (oy + 0.5) / scale - 0.5) : 255
      }
    }
    onProgress('upscale', (t + 1) / tiles.length)
  }

  return { width: ow, height: oh, data: out, backend: rt.backend }
}
