import { type Drawable, canvasToBlob, decodeImage, resample } from './canvas'

/** 列表缩略图长边：覆盖卡片宽度 × 2x DPR */
export const THUMB_SIDE = 480

export interface ImageProbe {
  width: number
  height: number
  thumb: Blob
}

/** 长边缩到 THUMB_SIDE 并编码为 WebP（保留透明；不支持时浏览器自动回退 PNG） */
export function makeThumbnail(src: Drawable, width: number, height: number): Promise<Blob> {
  const s = Math.min(1, THUMB_SIDE / Math.max(width, height))
  const w = Math.max(1, Math.round(width * s))
  const h = Math.max(1, Math.round(height * s))
  return canvasToBlob(resample(src, { x: 0, y: 0, w: width, h: height }, w, h), 'image/webp', 0.8)
}

/** 解码一次，同时拿到原图尺寸与缩略图，避免列表直接渲染原图 */
export async function probeImage(source: Blob): Promise<ImageProbe> {
  const bmp = await decodeImage(source)
  try {
    return { width: bmp.width, height: bmp.height, thumb: await makeThumbnail(bmp, bmp.width, bmp.height) }
  } finally {
    bmp.close()
  }
}
