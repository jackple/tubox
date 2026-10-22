import type { Drawable } from '../canvas'
import type { Layer, Paint, Scene } from '../scene/types'
import { type GridTemplate, layoutCells } from './templates'

export interface GridOptions {
  templateId: string
  ratio: [number, number]
  gap: number
  padding: number
  radius: number
  background: Paint
}

export const defaultGridOptions: GridOptions = {
  templateId: '4-grid',
  ratio: [1, 1],
  gap: 16,
  padding: 16,
  radius: 12,
  background: '#ffffff',
}

export const GRID_LONG_SIDE = 2400

export function gridSize(ratio: [number, number]): [number, number] {
  const [a, b] = ratio
  return a >= b ? [GRID_LONG_SIDE, Math.round((GRID_LONG_SIDE * b) / a)] : [Math.round((GRID_LONG_SIDE * a) / b), GRID_LONG_SIDE]
}

export function buildGrid(images: Drawable[], template: GridTemplate, o: GridOptions, placeholder = true): Scene {
  const [W, H] = gridSize(o.ratio)
  const rects = layoutCells(template.cells, W, H, o.padding, o.gap)
  const layers: Layer[] = rects.map((r, i): Layer => {
    const image = images[i]
    return image
      ? { type: 'image', image, ...r, fit: 'cover', radius: o.radius }
      : { type: 'rect', ...r, radius: o.radius, fill: placeholder ? 'rgba(128,128,160,0.14)' : 'rgba(0,0,0,0)' }
  })
  return { width: W, height: H, background: o.background, layers }
}
