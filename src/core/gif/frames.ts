import { type AnyCanvas, type Ctx2D, type Drawable, createCanvas, getCtx } from '../canvas'

export type GifRatio = 'auto' | '1:1' | '4:5' | '3:4' | '16:9' | '9:16'
export type GifFit = 'contain' | 'cover'
export type GifTransition = 'none' | 'fade'

export interface GifOptions {
  /** 输出宽度（px），高度按比例计算 */
  width: number
  /** auto 跟随第一张图片 */
  ratio: GifRatio
  /** contain 完整显示（留边填背景色），cover 裁切铺满 */
  fit: GifFit
  background: string
  /** 每张图片停留时长（ms） */
  delay: number
  transition: GifTransition
  /** 往返播放：1 → N → 1 */
  pingpong: boolean
  /** 无限循环；关闭则只播放一次 */
  loop: boolean
  /** 每帧调色板颜色数，越少体积越小 */
  colors: number
}

export const defaultGifOptions: GifOptions = {
  width: 480,
  ratio: 'auto',
  fit: 'cover',
  background: '#FFFFFF',
  delay: 600,
  transition: 'none',
  pingpong: false,
  loop: true,
  colors: 256,
}

export const gifRatios: GifRatio[] = ['auto', '1:1', '4:5', '3:4', '16:9', '9:16']

/** 渐变过渡的插值帧数与每帧时长（GIF 帧时长精度为 10ms，浏览器会把 <20ms 的帧拉长，取 60ms） */
const FADE_STEPS = 6
const FADE_DELAY = 60
/** 输出高度上限，防止竖长比例下画布过大 */
const MAX_HEIGHT = 2160

export function gifSize(first: { width: number; height: number } | undefined, o: Pick<GifOptions, 'width' | 'ratio'>) {
  let r = first ? first.width / first.height : 1
  if (o.ratio !== 'auto') {
    const [a, b] = o.ratio.split(':').map(Number)
    r = a / b
  }
  let width = Math.max(16, Math.round(o.width))
  let height = Math.max(16, Math.round(width / r))
  if (height > MAX_HEIGHT) {
    height = MAX_HEIGHT
    width = Math.max(16, Math.round(height * r))
  }
  return { width, height }
}

/** 一帧：图片 a，叠加透明度为 t 的图片 b（渐变过渡时） */
export interface GifFrame {
  a: number
  b: number
  t: number
  delay: number
}

/** 按图片数量与选项生成帧序列（预览与导出共用） */
export function planFrames(count: number, o: GifOptions): GifFrame[] {
  if (!count) return []
  const order = Array.from({ length: count }, (_, i) => i)
  if (o.pingpong && count > 2) for (let i = count - 2; i > 0; i--) order.push(i)
  const frames: GifFrame[] = []
  order.forEach((a, k) => {
    frames.push({ a, b: -1, t: 0, delay: o.delay })
    const last = k === order.length - 1
    if (o.transition !== 'fade' || order.length < 2 || (last && !o.loop)) return
    const b = order[(k + 1) % order.length]
    for (let s = 1; s <= FADE_STEPS; s++) frames.push({ a, b, t: s / (FADE_STEPS + 1), delay: FADE_DELAY })
  })
  return frames
}

export const totalDuration = (frames: { delay: number }[]) => frames.reduce((s, f) => s + f.delay, 0)

function drawFit(ctx: Ctx2D, img: Drawable, w: number, h: number, fit: GifFit) {
  const k = fit === 'cover' ? Math.max(w / img.width, h / img.height) : Math.min(w / img.width, h / img.height)
  const dw = img.width * k
  const dh = img.height * k
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
}

let scratch: AnyCanvas | null = null

/** 绘制一帧到 w×h 的画布 */
export function drawFrame(ctx: Ctx2D, images: Drawable[], f: GifFrame, w: number, h: number, o: Pick<GifOptions, 'fit' | 'background'>) {
  ctx.globalAlpha = 1
  ctx.fillStyle = o.background
  ctx.fillRect(0, 0, w, h)
  drawFit(ctx, images[f.a], w, h, o.fit)
  if (f.b < 0 || f.t <= 0) return
  if (o.fit === 'cover') {
    ctx.globalAlpha = f.t
    drawFit(ctx, images[f.b], w, h, o.fit)
  } else {
    // contain 模式下两张图的留边不同，先把下一帧完整画到暂存画布再整体淡入，避免残影
    if (!scratch || scratch.width !== w || scratch.height !== h) scratch = createCanvas(w, h)
    const sctx = getCtx(scratch)
    sctx.fillStyle = o.background
    sctx.fillRect(0, 0, w, h)
    drawFit(sctx, images[f.b], w, h, o.fit)
    ctx.globalAlpha = f.t
    ctx.drawImage(scratch, 0, 0)
  }
  ctx.globalAlpha = 1
}
