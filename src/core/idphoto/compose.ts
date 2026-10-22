import { type AnyCanvas, type Drawable, createCanvas, getCtx } from '../canvas'
import { resolvePaint } from '../scene/paint'
import type { Paint } from '../scene/types'
import type { PortraitAnalysis } from './analyze'
import type { PhotoSpec } from './specs'

/** 自动构图：把工作图中的锚点（面部中心）映射到输出画布 */
export interface Framing {
  scale: number
  /** 源图锚点 */
  ax: number
  ay: number
  /** 目标锚点（输出像素） */
  tx: number
  ty: number
  /** 自动纠正的倾斜角（度） */
  tilt: number
}

/** 用户微调 */
export interface Adjust {
  zoom: number
  dx: number
  dy: number
  rotate: number
  brightness: number
  contrast: number
  saturation: number
  warmth: number
}

export const defaultAdjust: Adjust = { zoom: 1, dx: 0, dy: 0, rotate: 0, brightness: 0, contrast: 0, saturation: 0, warmth: 0 }

export function autoFrame(a: PortraitAnalysis, spec: PhotoSpec, size: [number, number]): Framing {
  const [W, H] = size
  const headH = Math.max(1, a.chin - a.headTop)
  const ratio = (spec.headRatio[0] + spec.headRatio[1]) / 2
  const scale = (ratio * H) / headH
  let tilt = 0
  const { leftEye: l, rightEye: r } = a.face ?? {}
  if (l && r) {
    const deg = (Math.atan2(l.y - r.y, l.x - r.x) * 180) / Math.PI
    // 只纠正明显但不夸张的倾斜
    if (Math.abs(deg) > 1 && Math.abs(deg) < 15) tilt = -deg
  }
  return {
    scale,
    ax: a.centerX,
    ay: (a.headTop + a.chin) / 2,
    tx: W / 2,
    ty: spec.topRatio * H + (ratio * H) / 2,
    tilt,
  }
}

/** 当前构图下头部占画面高度的比例 */
export function headRatioOf(a: PortraitAnalysis, f: Framing, adj: Adjust, H: number) {
  return ((a.chin - a.headTop) * f.scale * adj.zoom) / H
}

/** 预先抠出人像（与背景色无关，可缓存） */
export function cutoutPerson(src: Drawable, mask: AnyCanvas): AnyCanvas {
  const c = createCanvas(src.width, src.height)
  const ctx = getCtx(c)
  ctx.drawImage(src, 0, 0)
  ctx.globalCompositeOperation = 'destination-in'
  ctx.drawImage(mask, 0, 0)
  return c
}

export function composeIdPhoto(person: Drawable, size: [number, number], bg: Paint | null, f: Framing, adj: Adjust): AnyCanvas {
  const [W, H] = size
  const layer = createCanvas(W, H)
  const lctx = getCtx(layer)
  lctx.translate(f.tx + adj.dx, f.ty + adj.dy)
  lctx.rotate(((f.tilt + adj.rotate) * Math.PI) / 180)
  lctx.scale(f.scale * adj.zoom, f.scale * adj.zoom)
  lctx.drawImage(person, -f.ax, -f.ay)
  applyTone(lctx, W, H, adj)

  const out = createCanvas(W, H)
  const ctx = getCtx(out)
  if (bg) {
    ctx.fillStyle = resolvePaint(ctx, bg, 0, 0, W, H)
    ctx.fillRect(0, 0, W, H)
  }
  ctx.drawImage(layer, 0, 0)
  return out
}

/** 逐像素调色（Safari 不支持 ctx.filter，这里统一手写），只作用于人像层 */
function applyTone(ctx: ReturnType<typeof getCtx>, W: number, H: number, a: Adjust) {
  if (!a.brightness && !a.contrast && !a.saturation && !a.warmth) return
  const img = ctx.getImageData(0, 0, W, H)
  const d = img.data
  const b = a.brightness * 1.2
  const C = a.contrast * 1.28
  const cf = (259 * (C + 255)) / (255 * (259 - C))
  const s = 1 + a.saturation / 100
  const warm = a.warmth * 0.35
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    let r = cf * (d[i] + b - 128) + 128 + warm
    let g = cf * (d[i + 1] + b - 128) + 128
    let bl = cf * (d[i + 2] + b - 128) + 128 - warm
    const l = 0.299 * r + 0.587 * g + 0.114 * bl
    r = l + (r - l) * s
    g = l + (g - l) * s
    bl = l + (bl - l) * s
    d[i] = r
    d[i + 1] = g
    d[i + 2] = bl
  }
  ctx.putImageData(img, 0, 0)
}
