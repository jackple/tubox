import { createCanvas, decodeImage, getCtx, resample } from '../canvas'
import { MIME_EXT, encodeCanvas } from '../encode'
import { renderFileName, stripExt } from './rename'
import { planResize } from './resize'
import type { BatchOptions, OutputFormat, ProcessMeta, ProcessResult } from './types'
import { drawWatermark } from './watermark'

const PASSTHROUGH = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function resolveOutputType(format: OutputFormat, sourceType: string): string {
  if (format !== 'original') return format
  return PASSTHROUGH.has(sourceType) ? sourceType : 'image/png'
}

/**
 * 批量处理管线：解码 → 缩放/裁切 → 水印 → 编码（可按目标体积压缩）→ 命名
 * 纯函数，可直接在 Worker 中运行。
 */
export async function processImage(source: Blob, o: BatchOptions, meta: ProcessMeta): Promise<ProcessResult> {
  const bmp = await decodeImage(source)
  const logo = o.watermark.enabled && o.watermark.kind === 'image' && o.watermark.image ? await decodeImage(o.watermark.image) : null

  try {
    const plan = planResize(bmp.width, bmp.height, o.resize)
    const type = resolveOutputType(o.output.format, source.type)

    const canvas = createCanvas(plan.width, plan.height)
    const ctx = getCtx(canvas)
    if (type === 'image/jpeg') {
      ctx.fillStyle = o.output.background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(resample(bmp, plan.src, plan.width, plan.height), 0, 0)
    drawWatermark(ctx, canvas.width, canvas.height, o.watermark, logo)

    const out = await encodeCanvas(canvas, type, o.output.quality / 100, o.output.targetKB)
    const name = renderFileName(
      o.rename.template,
      { name: stripExt(meta.name), index: meta.index, width: out.width, height: out.height },
      MIME_EXT[type] ?? 'png',
    )
    return { ...out, name }
  } finally {
    bmp.close()
    logo?.close()
  }
}
