import { type AnyCanvas, createCanvas, getCtx } from '../canvas'
import type { PhotoSpec } from './specs'

export interface Paper {
  id: string
  name: string
  mm: [number, number]
}

export const papers: Paper[] = [
  { id: '6in', name: '6 寸', mm: [152, 102] },
  { id: '5in', name: '5 寸', mm: [127, 89] },
  { id: 'a4', name: 'A4', mm: [297, 210] },
]

const PRINT_DPI = 300
const mm2px = (mm: number) => Math.round((mm / 25.4) * PRINT_DPI)

/** 把单张证件照排到冲印相纸上，自动选择能放下最多张的方向，并绘制裁切线 */
export function buildPrintSheet(photo: AnyCanvas, spec: PhotoSpec, paper: Paper): { canvas: AnyCanvas; count: number } {
  const pw = spec.mm ? mm2px(spec.mm[0]) : Math.round((spec.px[0] / spec.dpi) * PRINT_DPI)
  const ph = spec.mm ? mm2px(spec.mm[1]) : Math.round((spec.px[1] / spec.dpi) * PRINT_DPI)
  const gap = mm2px(2)
  const margin = mm2px(4)

  const fit = (W: number, H: number) => {
    const cols = Math.max(0, Math.floor((W - margin * 2 + gap) / (pw + gap)))
    const rows = Math.max(0, Math.floor((H - margin * 2 + gap) / (ph + gap)))
    return { W, H, cols, rows, count: cols * rows }
  }
  const [a, b] = paper.mm.map(mm2px)
  const landscape = fit(Math.max(a, b), Math.min(a, b))
  const portrait = fit(Math.min(a, b), Math.max(a, b))
  const best = portrait.count > landscape.count ? portrait : landscape

  const canvas = createCanvas(best.W, best.H)
  const ctx = getCtx(canvas)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, best.W, best.H)

  const gridW = best.cols * pw + (best.cols - 1) * gap
  const gridH = best.rows * ph + (best.rows - 1) * gap
  const ox = (best.W - gridW) / 2
  const oy = (best.H - gridH) / 2
  ctx.strokeStyle = '#d4d4d8'
  ctx.lineWidth = 2
  for (let r = 0; r < best.rows; r++) {
    for (let c = 0; c < best.cols; c++) {
      const x = ox + c * (pw + gap)
      const y = oy + r * (ph + gap)
      ctx.drawImage(photo, x, y, pw, ph)
      ctx.strokeRect(x - 1, y - 1, pw + 2, ph + 2)
    }
  }
  return { canvas, count: best.count }
}

export { PRINT_DPI }
