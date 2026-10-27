/**
 * 标注图形：坐标均为原图像素坐标，与显示缩放无关。
 * size 为 1-10 的粗细档位，实际像素由 metrics() 按图片尺寸换算，保证不同分辨率下观感一致。
 */

interface Base {
  id: string
  color: string
  size: number
}

/** 两点定义的图形（矩形 / 椭圆 / 箭头 / 直线 / 马赛克），fill 为实心（矩形 / 椭圆） */
export interface BoxShape extends Base {
  kind: 'rect' | 'ellipse' | 'arrow' | 'line' | 'mosaic'
  x1: number
  y1: number
  x2: number
  y2: number
  fill?: boolean
}

/** 自由画笔 / 荧光笔：points 为扁平的 [x0, y0, x1, y1, ...] */
export interface PathShape extends Base {
  kind: 'pen' | 'marker'
  points: number[]
}

/** 文字：(x, y) 为左上角；fill 为带底色的标签样式 */
export interface TextShape extends Base {
  kind: 'text'
  x: number
  y: number
  text: string
  fill?: boolean
}

/** 序号圆点：(x, y) 为圆心，编号按出现顺序自动生成 */
export interface StepShape extends Base {
  kind: 'step'
  x: number
  y: number
}

export type Shape = BoxShape | PathShape | TextShape | StepShape
export type ShapeKind = Shape['kind']

// kind 为多值联合的成员无法靠 s.kind === 'x' 排除，用类型守卫区分
export const isPath = (s: Shape): s is PathShape => s.kind === 'pen' || s.kind === 'marker'

export const isBox = (s: Shape): s is BoxShape =>
  s.kind === 'rect' || s.kind === 'ellipse' || s.kind === 'arrow' || s.kind === 'line' || s.kind === 'mosaic'

/** 新建图形（尚未分配 id）；按联合类型逐个 Omit，保留各成员的专有字段 */
export type NewShape = Shape extends infer S ? (S extends Shape ? Omit<S, 'id'> : never) : never
