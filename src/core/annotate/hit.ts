import type { Rect } from '../canvas'
import { metrics, textLayout } from './render'
import { type Shape, isBox, isPath } from './types'

/** 点到线段的距离 */
function segDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1
  const dy = y2 - y1
  const l2 = dx * dx + dy * dy
  const t = l2 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2)) : 0
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

/** 图形外框（含线宽），用于选中框 */
export function shapeBounds(s: Shape, unit: number): Rect {
  const { stroke, radius } = metrics(s.size, unit)
  if (s.kind === 'text') return textLayout(s, unit).box
  if (s.kind === 'step') return { x: s.x - radius, y: s.y - radius, w: radius * 2, h: radius * 2 }
  let x0: number, y0: number, x1: number, y1: number
  if (isBox(s)) {
    ;[x0, x1] = [Math.min(s.x1, s.x2), Math.max(s.x1, s.x2)]
    ;[y0, y1] = [Math.min(s.y1, s.y2), Math.max(s.y1, s.y2)]
  } else {
    const xs = s.points.filter((_, i) => i % 2 === 0)
    const ys = s.points.filter((_, i) => i % 2 === 1)
    ;[x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  }
  const pad = isPath(s) ? (s.kind === 'marker' ? stroke * 3.5 : stroke) / 2 : s.kind === 'mosaic' || s.fill ? 0 : stroke / 2
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 }
}

function hit(s: Shape, x: number, y: number, unit: number, tol: number): boolean {
  const { stroke, radius } = metrics(s.size, unit)
  if (s.kind === 'step') return Math.hypot(x - s.x, y - s.y) <= radius + tol
  if (s.kind === 'text') {
    const b = textLayout(s, unit).box
    return x >= b.x - tol && x <= b.x + b.w + tol && y >= b.y - tol && y <= b.y + b.h + tol
  }
  if (isPath(s)) {
    const reach = (s.kind === 'marker' ? stroke * 3.5 : stroke) / 2 + tol
    const p = s.points
    if (p.length === 2) return Math.hypot(x - p[0], y - p[1]) <= reach
    for (let i = 0; i < p.length - 2; i += 2) if (segDist(x, y, p[i], p[i + 1], p[i + 2], p[i + 3]) <= reach) return true
    return false
  }
  const reach = stroke / 2 + tol
  if (s.kind === 'arrow' || s.kind === 'line') return segDist(x, y, s.x1, s.y1, s.x2, s.y2) <= reach
  const x0 = Math.min(s.x1, s.x2)
  const y0 = Math.min(s.y1, s.y2)
  const w = Math.abs(s.x2 - s.x1)
  const h = Math.abs(s.y2 - s.y1)
  const inside = x >= x0 - reach && x <= x0 + w + reach && y >= y0 - reach && y <= y0 + h + reach
  if (s.kind === 'mosaic' || s.fill || !inside) return inside
  if (s.kind === 'rect') return x <= x0 + reach || x >= x0 + w - reach || y <= y0 + reach || y >= y0 + h - reach
  // 空心椭圆：只在轮廓附近命中
  const rx = Math.max(w / 2, 1)
  const ry = Math.max(h / 2, 1)
  const d = Math.hypot((x - x0 - rx) / rx, (y - y0 - ry) / ry)
  return Math.abs(d - 1) * Math.min(rx, ry) <= reach
}

/** 自上而下查找命中的图形；tol 为额外容差（原图像素） */
export function hitTest(shapes: Shape[], x: number, y: number, unit: number, tol: number): Shape | undefined {
  for (let i = shapes.length - 1; i >= 0; i--) if (hit(shapes[i], x, y, unit, tol)) return shapes[i]
}

export function moveShape(s: Shape, dx: number, dy: number): Shape {
  if (isBox(s)) return { ...s, x1: s.x1 + dx, y1: s.y1 + dy, x2: s.x2 + dx, y2: s.y2 + dy }
  if (isPath(s)) return { ...s, points: s.points.map((v, i) => v + (i % 2 ? dy : dx)) }
  return { ...s, x: s.x + dx, y: s.y + dy }
}
