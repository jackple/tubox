/**
 * Canvas 基础设施：同一套代码同时运行在主线程与 Web Worker 中。
 * 有 OffscreenCanvas 时优先使用（Worker 中只有它），否则回退到 <canvas>。
 */

import { coreError } from './errors'

export type AnyCanvas = OffscreenCanvas | HTMLCanvasElement
export type Ctx2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D
export type Drawable = ImageBitmap | AnyCanvas

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** 兼顾 iOS Safari 的安全画布上限 */
export const MAX_CANVAS_SIDE = 16384
export const MAX_CANVAS_AREA = 16_777_216

export const hasOffscreen = typeof OffscreenCanvas !== 'undefined'

const isOffscreen = (c: AnyCanvas): c is OffscreenCanvas => 'convertToBlob' in c

export function createCanvas(w: number, h: number): AnyCanvas {
  const width = Math.max(1, Math.round(w))
  const height = Math.max(1, Math.round(h))
  if (hasOffscreen) return new OffscreenCanvas(width, height)
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  return c
}

export function getCtx(c: AnyCanvas, opts?: CanvasRenderingContext2DSettings): Ctx2D {
  const ctx = (isOffscreen(c) ? c.getContext('2d', opts) : c.getContext('2d', opts)) as Ctx2D | null
  if (!ctx) throw coreError('canvas-unsupported')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return ctx
}

export function canvasToBlob(c: AnyCanvas, type: string, quality?: number): Promise<Blob> {
  if (isOffscreen(c)) return c.convertToBlob({ type, quality })
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(coreError('encode-failed'))), type, quality))
}

/** 解码图片并自动应用 EXIF 方向 */
export async function decodeImage(blob: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob, { imageOrientation: 'from-image' })
  } catch {
    try {
      return await createImageBitmap(blob)
    } catch {
      throw coreError(/hei[cf]/i.test(blob.type) ? 'heic-unsupported' : 'decode-failed')
    }
  }
}

/**
 * 高质量缩放：大比例缩小时逐级减半，避免一次性缩放产生的锯齿与摩尔纹。
 * @param src 源图
 * @param r   源图中参与缩放的区域
 */
export function resample(src: Drawable, r: Rect, w: number, h: number): AnyCanvas {
  let cur: Drawable = src
  let { x, y, w: cw, h: ch } = r
  while (cw / 2 >= w && ch / 2 >= h) {
    const nw = Math.round(cw / 2)
    const nh = Math.round(ch / 2)
    const step = createCanvas(nw, nh)
    getCtx(step).drawImage(cur, x, y, cw, ch, 0, 0, nw, nh)
    cur = step
    x = 0
    y = 0
    cw = nw
    ch = nh
  }
  const out = createCanvas(w, h)
  getCtx(out).drawImage(cur, x, y, cw, ch, 0, 0, out.width, out.height)
  return out
}

export function roundRectPath(ctx: Ctx2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

let filterSupport: boolean | null = null
/** Safari 的 Canvas 至今不支持 ctx.filter，需要特性检测 */
export function supportsCanvasFilter(): boolean {
  if (filterSupport === null) {
    try {
      const ctx = getCtx(createCanvas(1, 1))
      ctx.filter = 'blur(2px)'
      filterSupport = ctx.filter === 'blur(2px)'
    } catch {
      filterSupport = false
    }
  }
  return filterSupport
}

const encodeSupport = new Map<string, Promise<boolean>>()
/** 检测浏览器能否编码某种格式（如 AVIF 仅部分浏览器支持） */
export function supportsEncode(type: string): Promise<boolean> {
  let p = encodeSupport.get(type)
  if (!p) {
    p = canvasToBlob(createCanvas(2, 2), type)
      .then((b) => b.type === type)
      .catch(() => false)
    encodeSupport.set(type, p)
  }
  return p
}

/** 把超出安全上限的画布尺寸等比压回来，返回缩放系数（≤1） */
export function safeScale(w: number, h: number): number {
  return Math.min(1, MAX_CANVAS_SIDE / w, MAX_CANVAS_SIDE / h, Math.sqrt(MAX_CANVAS_AREA / (w * h)))
}
