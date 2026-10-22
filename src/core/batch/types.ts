export type ResizeMode = 'long' | 'fit' | 'cover' | 'exact' | 'width' | 'height' | 'scale'

export interface ResizeOptions {
  enabled: boolean
  mode: ResizeMode
  width: number
  height: number
  /** mode = scale 时的百分比 */
  scale: number
  /** 不放大小图 */
  noEnlarge: boolean
}

/** 两个字符：行(t/m/b) + 列(l/c/r) */
export type Anchor = 'tl' | 'tc' | 'tr' | 'ml' | 'mc' | 'mr' | 'bl' | 'bc' | 'br'

export interface WatermarkOptions {
  enabled: boolean
  kind: 'text' | 'image'
  text: string
  color: string
  /** 字号：占短边的百分比 */
  fontSize: number
  bold: boolean
  /** 0-100 */
  opacity: number
  anchor: Anchor
  /** 平铺防盗图 */
  tile: boolean
  rotation: number
  /** 边距：占短边的百分比 */
  margin: number
  /** 平铺间距：占短边的百分比 */
  gap: number
  shadow: boolean
  image: Blob | null
  imageName?: string
  /** 图片水印宽度：占画面宽度的百分比 */
  imageScale: number
}

export type OutputFormat = 'original' | 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif'

export interface OutputOptions {
  format: OutputFormat
  /** 0-100 */
  quality: number
  /** 目标体积上限（KB），null 表示不限制 */
  targetKB: number | null
  /** 透明图转 JPG 时的底色 */
  background: string
}

export interface BatchOptions {
  resize: ResizeOptions
  watermark: WatermarkOptions
  output: OutputOptions
  rename: { template: string }
}

export interface ProcessMeta {
  index: number
  name: string
  /** 同时生成列表缩略图 */
  thumb?: boolean
}

export interface ProcessResult {
  blob: Blob
  width: number
  height: number
  name: string
  thumb?: Blob
}

export const defaultBatchOptions: BatchOptions = {
  resize: { enabled: false, mode: 'long', width: 1920, height: 1080, scale: 50, noEnlarge: true },
  watermark: {
    enabled: false,
    kind: 'text',
    text: '© Tubox',
    color: '#ffffff',
    fontSize: 4,
    bold: true,
    opacity: 70,
    anchor: 'br',
    tile: false,
    rotation: -30,
    margin: 3,
    gap: 12,
    shadow: true,
    image: null,
    imageScale: 18,
  },
  output: { format: 'original', quality: 82, targetKB: null, background: '#ffffff' },
  rename: { template: '{name}' },
}
