import { type AnyCanvas, createCanvas, getCtx } from '../canvas'
import { coreError } from '../errors'
import { getFaceDetector, getSegmenter } from './vision'

export interface Point {
  x: number
  y: number
}

export interface FaceInfo {
  x: number
  y: number
  w: number
  h: number
  rightEye?: Point
  leftEye?: Point
}

export interface PortraitAnalysis {
  width: number
  height: number
  /** 人像 alpha 蒙版（白色 + alpha），与工作图同尺寸；分割失败时为 null */
  mask: AnyCanvas | null
  face: FaceInfo | null
  /** 头顶（含头发）的 y 坐标 */
  headTop: number
  /** 下巴的 y 坐标 */
  chin: number
  /** 面部中心 x */
  centerX: number
}

export type AnalyzeStep = 'model' | 'segment' | 'face' | 'done'

/**
 * 人像分析：人像分割（换底）+ 人脸检测（自动构图）。
 * 任一模型失败都会降级，保证用户至少可以手动调整。
 */
export async function analyzePortrait(img: ImageBitmap, onStep?: (s: AnalyzeStep) => void): Promise<PortraitAnalysis> {
  const W = img.width
  const H = img.height

  onStep?.('model')
  const [segmenter, detector] = await Promise.all([getSegmenter().catch(() => null), getFaceDetector().catch(() => null)])
  if (!segmenter && !detector) throw coreError('model-load-failed')

  onStep?.('segment')
  const mask = segmenter ? buildMask(segmenter.segment(img), W, H) : null

  onStep?.('face')
  let face: FaceInfo | null = null
  if (detector) {
    const det = detector
      .detect(img)
      .detections.filter((d) => d.boundingBox)
      .sort((a, b) => b.boundingBox!.width * b.boundingBox!.height - a.boundingBox!.width * a.boundingBox!.height)[0]
    if (det?.boundingBox) {
      const b = det.boundingBox
      const kp = det.keypoints
      face = {
        x: b.originX,
        y: b.originY,
        w: b.width,
        h: b.height,
        rightEye: kp[0] && { x: kp[0].x * W, y: kp[0].y * H },
        leftEye: kp[1] && { x: kp[1].x * W, y: kp[1].y * H },
      }
    }
  }

  const geometry = estimateHead(W, H, mask, face)
  onStep?.('done')
  return { width: W, height: H, mask, face, ...geometry }
}

type SegmentResult = ReturnType<Awaited<ReturnType<typeof getSegmenter>>['segment']>

function buildMask(result: SegmentResult, W: number, H: number): AnyCanvas | null {
  const masks = result.confidenceMasks
  if (!masks?.length) return null
  // selfie_multiclass：0 = 背景，其余为头发 / 皮肤 / 衣物等
  const bg = masks[0]
  const mw = bg.width
  const mh = bg.height
  const data = new Float32Array(bg.getAsFloat32Array())
  masks.forEach((m) => m.close())

  const small = createCanvas(mw, mh)
  const sctx = getCtx(small)
  const img = sctx.createImageData(mw, mh)
  for (let i = 0; i < data.length; i++) {
    const o = i * 4
    img.data[o] = img.data[o + 1] = img.data[o + 2] = 255
    img.data[o + 3] = (1 - data[i]) * 255
  }
  sctx.putImageData(img, 0, 0)

  // 双线性放大到工作分辨率后做 smoothstep 收边，减少低分辨率蒙版的毛糙感
  const full = createCanvas(W, H)
  const fctx = getCtx(full, { willReadFrequently: true })
  fctx.drawImage(small, 0, 0, W, H)
  const px = fctx.getImageData(0, 0, W, H)
  const d = px.data
  for (let i = 3; i < d.length; i += 4) {
    const t = Math.min(1, Math.max(0, (d[i] / 255 - 0.3) / 0.4))
    d[i] = t * t * (3 - 2 * t) * 255
  }
  fctx.putImageData(px, 0, 0)
  return full
}

function estimateHead(W: number, H: number, mask: AnyCanvas | null, face: FaceInfo | null) {
  const centerX = face ? face.x + face.w / 2 : W / 2

  let headTop: number | null = null
  if (mask) {
    // 在脸部所在列附近自上而下扫描，找到头发顶端
    const half = face ? face.w * 0.6 : W * 0.15
    const x0 = Math.max(0, Math.round(centerX - half))
    const x1 = Math.min(W, Math.round(centerX + half))
    const { data } = getCtx(mask).getImageData(x0, 0, Math.max(1, x1 - x0), H)
    const rowW = Math.max(1, x1 - x0)
    outer: for (let y = 0; y < H; y++) {
      let hits = 0
      for (let x = 0; x < rowW; x++)
        if (data[(y * rowW + x) * 4 + 3] > 140 && ++hits > rowW * 0.08) {
          headTop = y
          break outer
        }
    }
  }

  if (face) {
    // BlazeFace 框大致从眉毛到下巴，头顶按经验向上补足额头与头发
    const chin = face.y + face.h * 1.02
    const top = headTop !== null && headTop < face.y ? headTop : face.y - face.h * 0.55
    return { headTop: top, chin, centerX }
  }
  const top = headTop ?? H * 0.12
  return { headTop: top, chin: top + H * 0.38, centerX }
}
