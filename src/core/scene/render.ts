import {
  type AnyCanvas,
  type Ctx2D,
  type Drawable,
  canvasToBlob,
  createCanvas,
  getCtx,
  roundRectPath,
  supportsCanvasFilter,
} from '../canvas'
import { FONT_SANS } from '../fonts'
import { resolvePaint } from './paint'
import type { ImageLayer, Layer, RectLayer, Scene, Shadow, TextLayer } from './types'

export interface RenderOptions {
  canvas?: AnyCanvas
  /** 输出缩放：预览时传入 显示比例 × DPR */
  scale?: number
}

export function renderScene(scene: Scene, opts: RenderOptions = {}): AnyCanvas {
  const s = opts.scale ?? 1
  const canvas = opts.canvas ?? createCanvas(scene.width * s, scene.height * s)
  const w = Math.max(1, Math.round(scene.width * s))
  const h = Math.max(1, Math.round(scene.height * s))
  if (canvas.width !== w) canvas.width = w
  if (canvas.height !== h) canvas.height = h

  const ctx = getCtx(canvas)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, w, h)
  ctx.setTransform(w / scene.width, 0, 0, h / scene.height, 0, 0)

  if (scene.background) {
    ctx.fillStyle = resolvePaint(ctx, scene.background, 0, 0, scene.width, scene.height)
    ctx.fillRect(0, 0, scene.width, scene.height)
  }
  for (const layer of scene.layers) drawLayer(ctx, layer)
  return canvas
}

export async function exportScene(scene: Scene, type = 'image/jpeg', quality = 0.92, scale = 1): Promise<Blob> {
  return canvasToBlob(renderScene(scene, { scale }), type, quality)
}

function drawLayer(ctx: Ctx2D, layer: Layer) {
  ctx.save()
  ctx.globalAlpha = layer.opacity ?? 1
  if (layer.rotate) {
    const o = layer.origin ?? (layer.type === 'text' ? layer : { x: layer.x + layer.w / 2, y: layer.y + layer.h / 2 })
    ctx.translate(o.x, o.y)
    ctx.rotate((layer.rotate * Math.PI) / 180)
    ctx.translate(-o.x, -o.y)
  }
  if (layer.type === 'text') drawText(ctx, layer)
  else if (layer.type === 'rect') drawRect(ctx, layer)
  else drawImageLayer(ctx, layer)
  ctx.restore()
}

function applyShadow(ctx: Ctx2D, s?: Shadow) {
  if (!s) return
  ctx.shadowColor = s.color
  ctx.shadowBlur = s.blur
  ctx.shadowOffsetX = s.x ?? 0
  ctx.shadowOffsetY = s.y ?? 0
}

function clearShadow(ctx: Ctx2D) {
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
}

function drawRect(ctx: Ctx2D, l: RectLayer) {
  roundRectPath(ctx, l.x, l.y, l.w, l.h, l.radius ?? 0)
  applyShadow(ctx, l.shadow)
  ctx.fillStyle = resolvePaint(ctx, l.fill, l.x, l.y, l.w, l.h)
  ctx.fill()
  if (l.stroke) {
    clearShadow(ctx)
    ctx.lineWidth = l.stroke.width
    ctx.strokeStyle = l.stroke.color
    ctx.stroke()
  }
}

function drawImageLayer(ctx: Ctx2D, l: ImageLayer) {
  const img = l.image
  let sx = 0
  let sy = 0
  let sw = img.width
  let sh = img.height
  if (l.crop) {
    sx = l.crop.x * img.width
    sy = l.crop.y * img.height
    sw = l.crop.w * img.width
    sh = l.crop.h * img.height
  }

  let dx = l.x
  let dy = l.y
  let dw = l.w
  let dh = l.h
  const fit = l.fit ?? 'cover'
  if (fit === 'cover') {
    const scale = Math.max(l.w / sw, l.h / sh) * Math.max(1, l.zoom ?? 1)
    const vw = l.w / scale
    const vh = l.h / scale
    const f = l.focus ?? { x: 0.5, y: 0.5 }
    sx += (sw - vw) * clamp01(f.x)
    sy += (sh - vh) * clamp01(f.y)
    sw = vw
    sh = vh
  } else if (fit === 'contain') {
    const scale = Math.min(l.w / sw, l.h / sh)
    dw = sw * scale
    dh = sh * scale
    dx = l.x + (l.w - dw) / 2
    dy = l.y + (l.h - dh) / 2
  }

  const r = l.radius ?? 0
  if (l.shadow) {
    ctx.save()
    roundRectPath(ctx, dx, dy, dw, dh, r)
    applyShadow(ctx, l.shadow)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()
  }

  ctx.save()
  if (r > 0) {
    roundRectPath(ctx, dx, dy, dw, dh, r)
    ctx.clip()
  }
  if (l.blur && l.blur > 0) drawBlurred(ctx, img, [sx, sy, sw, sh], [dx, dy, dw, dh], l.blur)
  else ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
  ctx.restore()

  if (l.stroke) {
    roundRectPath(ctx, dx, dy, dw, dh, r)
    ctx.lineWidth = l.stroke.width
    ctx.strokeStyle = l.stroke.color
    ctx.stroke()
  }
}

export type Box = [number, number, number, number]

export function drawBlurred(ctx: Ctx2D, img: Drawable, s: Box, d: Box, blur: number) {
  if (supportsCanvasFilter()) {
    ctx.filter = `blur(${blur}px)`
    ctx.drawImage(img, ...s, ...d)
    ctx.filter = 'none'
    return
  }
  // Safari 回退：缩小再放大，近似高斯模糊
  const factor = Math.max(2, blur / 1.5)
  const tw = Math.max(1, d[2] / factor)
  const th = Math.max(1, d[3] / factor)
  const tmp = createCanvas(tw, th)
  getCtx(tmp).drawImage(img, ...s, 0, 0, tmp.width, tmp.height)
  ctx.drawImage(tmp, ...d)
}

const CJK = /[⺀-鿿豈-﫿＀-￯　-〿]/

/** 中英文混排换行：中文按字断行，英文按词断行 */
export function wrapText(ctx: Ctx2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const para of text.split('\n')) {
    const tokens = para.match(/[⺀-鿿豈-﫿＀-￯　-〿]|[^\s⺀-鿿豈-﫿＀-￯　-〿]+|\s+/g) ?? ['']
    let line = ''
    for (const t of tokens) {
      const next = line + t
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line.trimEnd())
        line = /^\s+$/.test(t) ? '' : t
      } else line = next
    }
    lines.push(line)
  }
  return lines
}

function drawText(ctx: Ctx2D, l: TextLayer) {
  if (!l.text) return
  ctx.font = `${l.italic ? 'italic ' : ''}${l.weight ?? 500} ${l.size}px ${l.family ?? FONT_SANS}`
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D).letterSpacing = `${l.letterSpacing ?? 0}px`
  ctx.textAlign = l.align ?? 'left'
  ctx.textBaseline = 'middle'

  let lines = l.maxWidth ? wrapText(ctx, l.text, l.maxWidth) : l.text.split('\n')
  if (l.maxLines && lines.length > l.maxLines) {
    lines = lines.slice(0, l.maxLines)
    const last = lines[l.maxLines - 1]
    lines[l.maxLines - 1] = (CJK.test(last) ? last.slice(0, -1) : last.replace(/\s*\S+$/, '')) + '…'
  }

  const lh = l.size * (l.lineHeight ?? 1.3)
  const total = lh * lines.length
  const top = l.valign === 'middle' ? l.y - total / 2 : l.valign === 'bottom' ? l.y - total : l.y

  if (l.pill && lines.length === 1) {
    const tw = ctx.measureText(lines[0]).width
    const pw = tw + l.pill.padX * 2
    const ph = lh + l.pill.padY * 2 - (lh - l.size)
    const px = l.align === 'center' ? l.x - pw / 2 : l.align === 'right' ? l.x - pw : l.x - l.pill.padX
    const py = top + lh / 2 - ph / 2
    roundRectPath(ctx, px, py, pw, ph, l.pill.radius)
    ctx.fillStyle = resolvePaint(ctx, l.pill.fill, px, py, pw, ph)
    ctx.fill()
  }

  applyShadow(ctx, l.shadow)
  ctx.fillStyle = l.color
  lines.forEach((line, i) => ctx.fillText(line, l.x, top + lh * (i + 0.5)))
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
