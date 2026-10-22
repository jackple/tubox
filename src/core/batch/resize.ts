import type { Rect } from '../canvas'
import type { ResizeOptions } from './types'

export interface ResizePlan {
  width: number
  height: number
  /** 源图中参与绘制的区域（cover 模式会裁切） */
  src: Rect
}

export function planResize(w: number, h: number, o: ResizeOptions): ResizePlan {
  const full: Rect = { x: 0, y: 0, w, h }
  if (!o.enabled) return { width: w, height: h, src: full }

  const W = Math.max(1, o.width)
  const H = Math.max(1, o.height)
  const lim = (s: number) => (o.noEnlarge ? Math.min(s, 1) : s)
  const by = (s: number): ResizePlan => ({
    width: Math.max(1, Math.round(w * s)),
    height: Math.max(1, Math.round(h * s)),
    src: full,
  })

  switch (o.mode) {
    case 'long':
      return by(lim(W / Math.max(w, h)))
    case 'fit':
      return by(lim(Math.min(W / w, H / h)))
    case 'width':
      return by(lim(W / w))
    case 'height':
      return by(lim(H / h))
    case 'scale':
      return by(Math.max(1, o.scale) / 100)
    case 'exact':
      return { width: W, height: H, src: full }
    case 'cover': {
      const s = Math.max(W / w, H / h)
      const sw = W / s
      const sh = H / s
      return { width: W, height: H, src: { x: (w - sw) / 2, y: (h - sh) / 2, w: sw, h: sh } }
    }
  }
}
