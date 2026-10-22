import type { Ctx2D } from '../canvas'
import type { Paint } from './types'

export function resolvePaint(ctx: Ctx2D, paint: Paint, x: number, y: number, w: number, h: number): string | CanvasGradient {
  if (typeof paint === 'string') return paint
  const a = (paint.angle * Math.PI) / 180
  const dx = Math.sin(a)
  const dy = -Math.cos(a)
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2
  const cx = x + w / 2
  const cy = y + h / 2
  const g = ctx.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half)
  for (const [o, c] of paint.stops) g.addColorStop(o, c)
  return g
}

/** 将 Paint 转成 CSS，用于 UI 色板展示 */
export function paintToCss(paint: Paint): string {
  if (typeof paint === 'string') return paint
  const stops = paint.stops.map(([o, c]) => `${c} ${Math.round(o * 100)}%`).join(', ')
  return `linear-gradient(${paint.angle}deg, ${stops})`
}

export const linear = (angle: number, ...colors: string[]): Paint => ({
  type: 'linear',
  angle,
  stops: colors.map((c, i) => [colors.length === 1 ? 0 : i / (colors.length - 1), c]),
})
