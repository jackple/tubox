import { type AnyCanvas, canvasToBlob, resample } from './canvas'

export interface EncodeResult {
  blob: Blob
  width: number
  height: number
}

/**
 * 编码画布，可选「目标体积」：
 * 1. 有损格式先二分查找质量；
 * 2. 最低质量仍超标（或 PNG 无损）时，逐步缩小尺寸再试。
 */
export async function encodeCanvas(canvas: AnyCanvas, type: string, quality = 0.9, targetKB?: number | null): Promise<EncodeResult> {
  const lossy = type !== 'image/png'
  const q = Math.min(1, Math.max(0.01, quality))
  const pack = (blob: Blob, c: AnyCanvas): EncodeResult => ({ blob, width: c.width, height: c.height })

  const first = await canvasToBlob(canvas, type, lossy ? q : undefined)
  if (!targetKB || first.size <= targetKB * 1024) return pack(first, canvas)

  const target = targetKB * 1024
  let cur = canvas
  let last = first
  for (let round = 0; round < 8; round++) {
    if (lossy) {
      let lo = 0.05
      let hi = q
      let best: Blob | null = null
      for (let i = 0; i < 7; i++) {
        const mid = (lo + hi) / 2
        const b = await canvasToBlob(cur, type, mid)
        if (b.size <= target) {
          best = b
          lo = mid
        } else hi = mid
      }
      if (best) return pack(best, cur)
    }
    const nw = Math.round(cur.width * 0.85)
    const nh = Math.round(cur.height * 0.85)
    if (nw < 16 || nh < 16) break
    cur = resample(cur, { x: 0, y: 0, w: cur.width, h: cur.height }, nw, nh)
    if (!lossy) {
      last = await canvasToBlob(cur, type)
      if (last.size <= target) return pack(last, cur)
    }
  }
  return pack(lossy ? await canvasToBlob(cur, type, 0.05) : last, cur)
}

/** 写入 JPEG 的 JFIF 打印分辨率（DPI），冲印证件照时尺寸才准确 */
export async function withJpegDpi(blob: Blob, dpi: number): Promise<Blob> {
  if (blob.type !== 'image/jpeg') return blob
  const buf = new Uint8Array(await blob.arrayBuffer())
  const isJfif = buf[2] === 0xff && buf[3] === 0xe0 && buf[6] === 0x4a && buf[7] === 0x46 && buf[8] === 0x49 && buf[9] === 0x46
  if (!isJfif) return blob
  buf[13] = 1 // 单位：dots per inch
  buf[14] = dpi >> 8
  buf[15] = dpi & 0xff
  buf[16] = dpi >> 8
  buf[17] = dpi & 0xff
  return new Blob([buf], { type: 'image/jpeg' })
}

export const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}
