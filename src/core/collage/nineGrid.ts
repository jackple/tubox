import { type Drawable, canvasToBlob, createCanvas, getCtx } from '../canvas'
import { renderScene } from '../scene/render'
import type { Scene } from '../scene/types'

/** 显示名见 i18n/messages 的 nine.layouts */
export interface SliceLayout {
  id: string
  cols: number
  rows: number
}

export const sliceLayouts: SliceLayout[] = [
  { id: '3x3', cols: 3, rows: 3 },
  { id: '2x2', cols: 2, rows: 2 },
  { id: '3x2', cols: 3, rows: 2 },
  { id: '3x1', cols: 3, rows: 1 },
  { id: '1x3', cols: 1, rows: 3 },
]

export interface NineGridOptions {
  layoutId: string
  /** 单格输出边长 */
  tile: number
  focus: { x: number; y: number }
  zoom: number
}

export const defaultNineGridOptions: NineGridOptions = {
  layoutId: '3x3',
  tile: 1080,
  focus: { x: 0.5, y: 0.5 },
  zoom: 1,
}

export function buildCropScene(image: Drawable, layout: SliceLayout, o: NineGridOptions): Scene {
  const width = layout.cols * o.tile
  const height = layout.rows * o.tile
  return {
    width,
    height,
    background: '#ffffff',
    layers: [{ type: 'image', image, x: 0, y: 0, w: width, h: height, fit: 'cover', focus: o.focus, zoom: o.zoom }],
  }
}

/** cover 模式下图片在场景坐标中可拖动的溢出量，用于把拖拽距离换算为焦点变化 */
export function coverOverflow(iw: number, ih: number, W: number, H: number, zoom: number) {
  const s = Math.max(W / iw, H / ih) * Math.max(1, zoom)
  return { x: iw * s - W, y: ih * s - H }
}

export async function sliceScene(scene: Scene, layout: SliceLayout, type = 'image/jpeg', quality = 0.95): Promise<Blob[]> {
  const full = renderScene(scene)
  const tw = full.width / layout.cols
  const th = full.height / layout.rows
  const out: Blob[] = []
  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      const tile = createCanvas(tw, th)
      getCtx(tile).drawImage(full, c * tw, r * th, tw, th, 0, 0, tile.width, tile.height)
      out.push(await canvasToBlob(tile, type, quality))
    }
  }
  return out
}
