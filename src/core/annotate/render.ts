import { type AnyCanvas, type Ctx2D, type Drawable, type Rect, createCanvas, getCtx, roundRectPath } from '../canvas'
import { FONT_SANS } from '../fonts'
import { type BoxShape, type PathShape, type Shape, type StepShape, type TextShape, isPath } from './types'

/** 尺寸基准：按图片长边 1000px 为 1，使粗细档位在不同分辨率下观感一致 */
export const unitOf = (w: number, h: number) => Math.max(w, h, 1) / 1000

/** 粗细档位（1-10）换算为各类图形的像素尺寸 */
export function metrics(size: number, unit: number) {
  return {
    stroke: Math.max(1, size * 1.6 * unit),
    font: (14 + size * 6) * unit,
    radius: (10 + size * 3.2) * unit,
    block: Math.max(2, (4 + size * 3) * unit),
  }
}

/** 在色块上使用的文字颜色：浅色底配墨色，深色底配白色 */
export function contrastColor(color: string) {
  const m = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(color)
  if (!m) return '#FFFFFF'
  const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.62 ? '#111114' : '#FFFFFF'
}

const textFont = (px: number) => `600 ${px}px ${FONT_SANS}`

let measureCtx: Ctx2D | null = null

/** 文字排版：多行文本的字号、行高、内边距与外框（原图坐标） */
export function textLayout(s: TextShape, unit: number) {
  const { font } = metrics(s.size, unit)
  measureCtx ??= getCtx(createCanvas(1, 1))
  measureCtx.font = textFont(font)
  const lines = s.text.split('\n')
  const lineHeight = font * 1.3
  const pad = s.fill ? font * 0.4 : 0
  const width = Math.max(font * 0.5, ...lines.map((l) => measureCtx!.measureText(l).width))
  const box: Rect = { x: s.x, y: s.y, w: width + pad * 2, h: lines.length * lineHeight + pad * 2 }
  return { lines, font, lineHeight, pad, box }
}

function strokeStyle(ctx: Ctx2D, color: string, width: number) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

function drawBox(ctx: Ctx2D, s: BoxShape, unit: number, src: Drawable) {
  const { stroke, block } = metrics(s.size, unit)
  const x = Math.min(s.x1, s.x2)
  const y = Math.min(s.y1, s.y2)
  const w = Math.abs(s.x2 - s.x1)
  const h = Math.abs(s.y2 - s.y1)
  strokeStyle(ctx, s.color, stroke)
  ctx.fillStyle = s.color

  if (s.kind === 'rect') {
    if (s.fill) ctx.fillRect(x, y, w, h)
    else ctx.strokeRect(x, y, w, h)
  } else if (s.kind === 'ellipse') {
    ctx.beginPath()
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
    if (s.fill) ctx.fill()
    else ctx.stroke()
  } else if (s.kind === 'line') {
    ctx.beginPath()
    ctx.moveTo(s.x1, s.y1)
    ctx.lineTo(s.x2, s.y2)
    ctx.stroke()
  } else if (s.kind === 'arrow') {
    const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1)
    if (len < 1) return
    const ux = (s.x2 - s.x1) / len
    const uy = (s.y2 - s.y1) / len
    const head = Math.min(len * 0.6, Math.max(stroke * 3.6, 12 * unit))
    const bx = s.x2 - ux * head
    const by = s.y2 - uy * head
    ctx.beginPath()
    ctx.moveTo(s.x1, s.y1)
    // 箭杆止于箭头内部，避免圆头从尖端露出
    ctx.lineTo(s.x2 - ux * head * 0.6, s.y2 - uy * head * 0.6)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(s.x2, s.y2)
    ctx.lineTo(bx - uy * head * 0.55, by + ux * head * 0.55)
    ctx.lineTo(bx + uy * head * 0.55, by - ux * head * 0.55)
    ctx.closePath()
    ctx.lineWidth = stroke * 0.5
    ctx.fill()
    ctx.stroke()
  } else {
    // 马赛克：源图区域先缩小到「每块一像素」，再关闭平滑放大
    const sx = Math.max(0, x)
    const sy = Math.max(0, y)
    const sw = Math.min(src.width, x + w) - sx
    const sh = Math.min(src.height, y + h) - sy
    if (sw < 1 || sh < 1) return
    const cols = Math.max(1, Math.ceil(sw / block))
    const rows = Math.max(1, Math.ceil(sh / block))
    // 块数取整后区域恰好铺满，块尺寸略有出入但不会越界
    const small = createCanvas(cols, rows)
    getCtx(small).drawImage(src, sx, sy, sw, sh, 0, 0, cols, rows)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(small, sx, sy, sw, sh)
  }
}

function drawPath(ctx: Ctx2D, s: PathShape, unit: number) {
  const { stroke } = metrics(s.size, unit)
  const p = s.points
  const marker = s.kind === 'marker'
  strokeStyle(ctx, s.color, marker ? stroke * 3.5 : stroke)
  if (marker) ctx.globalAlpha = 0.4
  ctx.beginPath()
  ctx.moveTo(p[0], p[1])
  if (p.length === 2) ctx.lineTo(p[0] + 0.01, p[1])
  // 以相邻点中点为端点的二次曲线，平滑手绘抖动
  for (let i = 2; i < p.length - 2; i += 2) ctx.quadraticCurveTo(p[i], p[i + 1], (p[i] + p[i + 2]) / 2, (p[i + 1] + p[i + 3]) / 2)
  if (p.length > 2) ctx.lineTo(p[p.length - 2], p[p.length - 1])
  ctx.stroke()
}

function drawText(ctx: Ctx2D, s: TextShape, unit: number) {
  const { lines, font, lineHeight, pad, box } = textLayout(s, unit)
  ctx.font = textFont(font)
  ctx.textBaseline = 'middle'
  const ink = contrastColor(s.color)
  if (s.fill) {
    ctx.fillStyle = s.color
    roundRectPath(ctx, box.x, box.y, box.w, box.h, font * 0.3)
    ctx.fill()
    ctx.fillStyle = ink
  } else {
    // 无底色时加一圈反色描边，任何背景上都清晰可读
    strokeStyle(ctx, ink, font * 0.16)
    lines.forEach((l, i) => ctx.strokeText(l, s.x, s.y + (i + 0.5) * lineHeight))
    ctx.fillStyle = s.color
  }
  lines.forEach((l, i) => ctx.fillText(l, s.x + pad, s.y + pad + (i + 0.5) * lineHeight))
}

function drawStep(ctx: Ctx2D, s: StepShape, unit: number, n: number) {
  const { radius } = metrics(s.size, unit)
  ctx.beginPath()
  ctx.arc(s.x, s.y, radius, 0, Math.PI * 2)
  ctx.fillStyle = s.color
  ctx.fill()
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = radius * 0.14
  ctx.stroke()
  ctx.fillStyle = contrastColor(s.color)
  ctx.font = textFont(radius * (n > 9 ? 0.95 : 1.15))
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(n), s.x, s.y + radius * 0.04)
}

/** 在 ctx 上绘制原图与全部标注；scale 为输出像素 / 原图像素 */
export function renderAnnotations(ctx: Ctx2D, src: Drawable, shapes: Shape[], scale = 1) {
  const unit = unitOf(src.width, src.height)
  ctx.save()
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.drawImage(src, 0, 0, src.width, src.height)
  let step = 0
  for (const s of shapes) {
    ctx.save()
    if (isPath(s)) drawPath(ctx, s, unit)
    else if (s.kind === 'text') drawText(ctx, s, unit)
    else if (s.kind === 'step') drawStep(ctx, s, unit, ++step)
    else drawBox(ctx, s, unit, src)
    ctx.restore()
  }
  ctx.restore()
}

/** 按原图分辨率输出 */
export function exportAnnotated(src: Drawable, shapes: Shape[]): AnyCanvas {
  const c = createCanvas(src.width, src.height)
  renderAnnotations(getCtx(c), src, shapes, 1)
  return c
}
