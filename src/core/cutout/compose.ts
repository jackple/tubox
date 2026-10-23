import { type AnyCanvas, type Drawable, type Rect, createCanvas, getCtx } from '../canvas'
import { drawBlurred } from '../scene/render'
import type { Matte } from './matte'

/** 抠图背景：透明 / 纯色 / 原图虚化（blur 为相对输出长边的强度，0-100） */
export type CutoutBackground = { kind: 'none' } | { kind: 'color'; color: string } | { kind: 'blur'; blur: number }

/**
 * 输出区域（源图坐标）：默认整张图；裁剪到人像时取人像外接框并按长边比例留白，限制在图片范围内。
 */
export function cutoutRegion(srcW: number, srcH: number, matte: Matte | null, crop: boolean, padding: number): Rect {
  const b = matte?.bounds
  if (!crop || !b || !matte) return { x: 0, y: 0, w: srcW, h: srcH }
  const k = srcW / matte.canvas.width
  const pad = Math.max(b.w, b.h) * k * padding
  const x0 = Math.max(0, Math.floor(b.x * k - pad))
  const y0 = Math.max(0, Math.floor(b.y * k - pad))
  const x1 = Math.min(srcW, Math.ceil((b.x + b.w) * k + pad))
  const y1 = Math.min(srcH, Math.ceil((b.y + b.h) * k + pad))
  return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) }
}

/** 合成抠图结果：源图 region 区域按 scale 输出 */
export function composeCutout(src: Drawable, matte: AnyCanvas, bg: CutoutBackground, region: Rect, scale: number): AnyCanvas {
  const W = Math.max(1, Math.round(region.w * scale))
  const H = Math.max(1, Math.round(region.h * scale))
  const kx = matte.width / src.width
  const ky = matte.height / src.height

  const layer = createCanvas(W, H)
  const lctx = getCtx(layer)
  lctx.drawImage(src, region.x, region.y, region.w, region.h, 0, 0, W, H)
  lctx.globalCompositeOperation = 'destination-in'
  lctx.drawImage(matte, region.x * kx, region.y * ky, region.w * kx, region.h * ky, 0, 0, W, H)

  const out = createCanvas(W, H)
  const ctx = getCtx(out)
  if (bg.kind === 'color') {
    ctx.fillStyle = bg.color
    ctx.fillRect(0, 0, W, H)
  } else if (bg.kind === 'blur' && bg.blur > 0) {
    const r = (bg.blur / 100) * Math.max(W, H) * 0.04
    // 略微放大绘制，避免模糊后画面四周透出透明边
    const m = r * 2
    drawBlurred(ctx, src, [region.x, region.y, region.w, region.h], [-m, -m, W + m * 2, H + m * 2], r)
  } else if (bg.kind === 'blur') {
    ctx.drawImage(src, region.x, region.y, region.w, region.h, 0, 0, W, H)
  }
  ctx.drawImage(layer, 0, 0)
  return out
}
