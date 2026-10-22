import type { Ctx2D, Drawable } from '../canvas'
import { FONT_SANS } from '../fonts'
import type { WatermarkOptions } from './types'

/** 在画布上绘制文字 / 图片水印，支持九宫格定位与斜向平铺 */
export function drawWatermark(ctx: Ctx2D, W: number, H: number, o: WatermarkOptions, logo: Drawable | null) {
  if (!o.enabled) return
  if (o.kind === 'text' && !o.text.trim()) return
  if (o.kind === 'image' && !logo) return

  const short = Math.min(W, H)
  const margin = (short * o.margin) / 100
  const col = o.anchor[1] as 'l' | 'c' | 'r'
  const row = o.anchor[0] as 't' | 'm' | 'b'

  ctx.save()
  ctx.globalAlpha = o.opacity / 100
  if (o.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = Math.max(2, short * 0.006)
    ctx.shadowOffsetY = Math.max(1, short * 0.0015)
  }

  let mw: number
  let mh: number
  let draw: (x: number, y: number) => void

  if (o.kind === 'image' && logo) {
    mw = (W * o.imageScale) / 100
    mh = (mw * logo.height) / logo.width
    draw = (x, y) => ctx.drawImage(logo, x, y, mw, mh)
  } else {
    const fs = Math.max(8, (short * o.fontSize) / 100)
    ctx.font = `${o.bold ? 700 : 500} ${fs}px ${FONT_SANS}`
    ctx.fillStyle = o.color
    ctx.textBaseline = 'top'
    const lines = o.text.split('\n')
    const widths = lines.map((l) => ctx.measureText(l).width)
    const lh = fs * 1.3
    mw = Math.max(...widths)
    mh = lh * lines.length - (lh - fs)
    const align = o.tile ? 'c' : col
    draw = (x, y) =>
      lines.forEach((l, i) => {
        const dx = align === 'l' ? 0 : align === 'c' ? (mw - widths[i]) / 2 : mw - widths[i]
        ctx.fillText(l, x + dx, y + i * lh)
      })
  }

  if (o.tile) {
    const gap = (short * o.gap) / 100
    const stepX = mw + gap
    const stepY = mh + gap * 0.8
    ctx.translate(W / 2, H / 2)
    ctx.rotate((o.rotation * Math.PI) / 180)
    const R = Math.hypot(W, H) / 2 + Math.max(stepX, stepY)
    let r = 0
    for (let y = -R; y < R; y += stepY, r++) {
      const offset = (r % 2) * (stepX / 2)
      for (let x = -R - offset; x < R; x += stepX) draw(x, y)
    }
  } else {
    const x = col === 'l' ? margin : col === 'c' ? (W - mw) / 2 : W - margin - mw
    const y = row === 't' ? margin : row === 'm' ? (H - mh) / 2 : H - margin - mh
    draw(x, y)
  }
  ctx.restore()
}
