import type { Rect } from '../canvas'

export interface GridTemplate {
  id: string
  count: number
  /** 归一化单元格（0-1） */
  cells: Rect[]
}

const R = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h })

const grid = (cols: number, rows: number): Rect[] =>
  Array.from({ length: cols * rows }, (_, i) => R((i % cols) / cols, Math.floor(i / cols) / rows, 1 / cols, 1 / rows))

const t = 1 / 3

export const gridTemplates: GridTemplate[] = [
  { id: '2-h', count: 2, cells: grid(2, 1) },
  { id: '2-v', count: 2, cells: grid(1, 2) },
  { id: '2-golden', count: 2, cells: [R(0, 0, 0.618, 1), R(0.618, 0, 0.382, 1)] },
  { id: '3-l1r2', count: 3, cells: [R(0, 0, 0.5, 1), R(0.5, 0, 0.5, 0.5), R(0.5, 0.5, 0.5, 0.5)] },
  { id: '3-t1b2', count: 3, cells: [R(0, 0, 1, 0.5), R(0, 0.5, 0.5, 0.5), R(0.5, 0.5, 0.5, 0.5)] },
  { id: '3-cols', count: 3, cells: grid(3, 1) },
  { id: '3-rows', count: 3, cells: grid(1, 3) },
  { id: '4-grid', count: 4, cells: grid(2, 2) },
  { id: '4-l1r3', count: 4, cells: [R(0, 0, 2 * t, 1), R(2 * t, 0, t, t), R(2 * t, t, t, t), R(2 * t, 2 * t, t, t)] },
  { id: '4-t1b3', count: 4, cells: [R(0, 0, 1, 2 * t), R(0, 2 * t, t, t), R(t, 2 * t, t, t), R(2 * t, 2 * t, t, t)] },
  { id: '4-stagger', count: 4, cells: [R(0, 0, 0.6, 0.5), R(0.6, 0, 0.4, 0.5), R(0, 0.5, 0.4, 0.5), R(0.4, 0.5, 0.6, 0.5)] },
  {
    id: '5-t2b3',
    count: 5,
    cells: [R(0, 0, 0.5, 0.5), R(0.5, 0, 0.5, 0.5), R(0, 0.5, t, 0.5), R(t, 0.5, t, 0.5), R(2 * t, 0.5, t, 0.5)],
  },
  {
    id: '5-l1r4',
    count: 5,
    cells: [R(0, 0, 0.5, 1), R(0.5, 0, 0.25, 0.5), R(0.75, 0, 0.25, 0.5), R(0.5, 0.5, 0.25, 0.5), R(0.75, 0.5, 0.25, 0.5)],
  },
  { id: '6-2x3', count: 6, cells: grid(2, 3) },
  { id: '6-3x2', count: 6, cells: grid(3, 2) },
  {
    id: '6-hero',
    count: 6,
    cells: [R(0, 0, 2 * t, 2 * t), R(2 * t, 0, t, t), R(2 * t, t, t, t), R(0, 2 * t, t, t), R(t, 2 * t, t, t), R(2 * t, 2 * t, t, t)],
  },
  { id: '8-2x4', count: 8, cells: grid(2, 4) },
  { id: '9-grid', count: 9, cells: grid(3, 3) },
]

/** 根据外边距与间距把归一化单元格换算成像素，内侧边各让出 gap/2 */
export function layoutCells(cells: Rect[], W: number, H: number, padding: number, gap: number): Rect[] {
  const iw = W - padding * 2
  const ih = H - padding * 2
  const e = 1e-6
  return cells.map((c) => {
    const l = c.x > e ? gap / 2 : 0
    const r = c.x + c.w < 1 - e ? gap / 2 : 0
    const t2 = c.y > e ? gap / 2 : 0
    const b = c.y + c.h < 1 - e ? gap / 2 : 0
    return {
      x: padding + c.x * iw + l,
      y: padding + c.y * ih + t2,
      w: c.w * iw - l - r,
      h: c.h * ih - t2 - b,
    }
  })
}
