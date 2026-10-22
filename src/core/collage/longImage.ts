import { type Drawable, safeScale } from '../canvas'
import type { Paint, Scene, ImageLayer } from '../scene/types'

export interface LongImageOptions {
  direction: 'vertical' | 'horizontal'
  /** subtitle：电影字幕拼接，首图完整，其余只保留底部字幕条 */
  mode: 'normal' | 'subtitle'
  /** 竖向为输出宽度，横向为输出高度 */
  size: number
  gap: number
  padding: number
  radius: number
  background: Paint
  /** 字幕条高度占比（%） */
  subtitleRatio: number
}

export const defaultLongImageOptions: LongImageOptions = {
  direction: 'vertical',
  mode: 'normal',
  size: 1080,
  gap: 0,
  padding: 0,
  radius: 0,
  background: '#ffffff',
  subtitleRatio: 16,
}

export interface LongImageBuild {
  scene: Scene
  /** 超过浏览器画布上限时的导出缩放 */
  exportScale: number
}

export function buildLongImage(images: Drawable[], o: LongImageOptions): LongImageBuild {
  const layers: ImageLayer[] = []
  const p = o.padding
  const inner = Math.max(1, o.size - p * 2)
  const vertical = o.direction === 'vertical'
  // 字幕模式下各条首尾相接，不留间距
  const gap = vertical && o.mode === 'subtitle' ? 0 : o.gap
  let cursor = p

  images.forEach((image, i) => {
    const subtitle = vertical && o.mode === 'subtitle' && i > 0
    const r = o.subtitleRatio / 100
    const crop = subtitle ? { x: 0, y: 1 - r, w: 1, h: r } : undefined
    const iw = image.width
    const ih = image.height * (subtitle ? r : 1)
    const len = vertical ? (inner * ih) / iw : (inner * iw) / ih
    layers.push({
      type: 'image',
      image,
      crop,
      fit: 'fill',
      radius: o.radius,
      ...(vertical ? { x: p, y: cursor, w: inner, h: len } : { x: cursor, y: p, w: len, h: inner }),
    })
    cursor += len + gap
  })

  const extent = images.length ? cursor - gap + p : o.size
  const width = vertical ? o.size : extent
  const height = vertical ? extent : o.size
  return {
    scene: { width, height, background: o.background, layers },
    exportScale: safeScale(width, height),
  }
}
