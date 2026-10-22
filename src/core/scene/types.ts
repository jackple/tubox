import type { Drawable, Rect } from '../canvas'

/**
 * 声明式场景：拼图 / 长图 / 九宫格 / 社交排版都只负责「生成场景」，
 * 由同一个渲染器画到预览画布（按显示尺寸缩放）或导出画布（原始分辨率）。
 */

export interface LinearGradient {
  type: 'linear'
  /** CSS 角度：0 = 向上，90 = 向右 */
  angle: number
  stops: [offset: number, color: string][]
}

export type Paint = string | LinearGradient

export interface Shadow {
  color: string
  blur: number
  x?: number
  y?: number
}

interface BoxBase extends Rect {
  opacity?: number
  /** 旋转角度（度），默认绕自身中心 */
  rotate?: number
  /** 旋转原点，用于让多个图层像「编组」一样一起旋转 */
  origin?: { x: number; y: number }
  radius?: number
  shadow?: Shadow
  stroke?: { color: string; width: number }
}

export interface RectLayer extends BoxBase {
  type: 'rect'
  fill: Paint
}

export interface ImageLayer extends BoxBase {
  type: 'image'
  image: Drawable
  fit?: 'cover' | 'contain' | 'fill'
  /** 归一化的源图裁切区域 */
  crop?: Rect
  /** cover 时的焦点，0-1，默认居中 */
  focus?: { x: number; y: number }
  /** cover 时额外放大，≥1 */
  zoom?: number
  blur?: number
}

export interface TextLayer {
  type: 'text'
  x: number
  y: number
  text: string
  size: number
  color: string
  weight?: number
  family?: string
  italic?: boolean
  align?: 'left' | 'center' | 'right'
  valign?: 'top' | 'middle' | 'bottom'
  maxWidth?: number
  maxLines?: number
  lineHeight?: number
  letterSpacing?: number
  opacity?: number
  shadow?: Shadow
  rotate?: number
  origin?: { x: number; y: number }
  /** 单行文字的胶囊背景（标签） */
  pill?: { fill: Paint; padX: number; padY: number; radius: number }
}

export type Layer = RectLayer | ImageLayer | TextLayer

export interface Scene {
  width: number
  height: number
  background?: Paint
  layers: Layer[]
}
