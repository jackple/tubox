import { MAX_CANVAS_AREA, createCanvas, decodeImage, getCtx } from '@/core/canvas'
import { uid } from './format'

export interface ImageAsset {
  id: string
  name: string
  file: File
  url: string
  bitmap: ImageBitmap
  width: number
  height: number
}

export const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif,image/svg+xml'

export const isImageFile = (f: File) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|avif|svg)$/i.test(f.name)

/** 解码为可直接绘制的位图；超大图按 maxSide（及画布面积上限）降采样以控制内存 */
export async function loadAsset(file: File, maxSide = 4096): Promise<ImageAsset> {
  let bitmap = await decodeImage(file)
  const s = Math.min(maxSide / Math.max(bitmap.width, bitmap.height), Math.sqrt(MAX_CANVAS_AREA / (bitmap.width * bitmap.height)))
  if (s < 1) {
    const c = createCanvas(bitmap.width * s, bitmap.height * s)
    getCtx(c).drawImage(bitmap, 0, 0, c.width, c.height)
    bitmap.close()
    bitmap = await createImageBitmap(c)
  }
  return {
    id: uid(),
    name: file.name,
    file,
    url: URL.createObjectURL(file),
    bitmap,
    width: bitmap.width,
    height: bitmap.height,
  }
}

export function disposeAsset(a: ImageAsset) {
  URL.revokeObjectURL(a.url)
  a.bitmap.close()
}

/** 并行加载，返回成功项与失败数 */
export async function loadAssets(files: File[], maxSide?: number) {
  const settled = await Promise.allSettled(files.filter(isImageFile).map((f) => loadAsset(f, maxSide)))
  const ok = settled.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
  return { ok, failed: settled.length - ok.length }
}
