import { useEffect, useMemo, useRef } from 'react'
import { CircleAlert, Copy, QrCode, Sparkles, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { qrPayload } from '@/core/qrcode/content'
import { DOTS_MAX_VERSION, QR_ART_PALETTES, contrastRatio, drawQr, encodeQr, layoutQr, luminance } from '@/core/qrcode/render'
import { useElementSize } from '@/hooks/useElementSize'
import { errorMessage, fmt, useMessages } from '@/i18n'
import { cn } from '@/lib/cn'
import { qrArtOptions, qrColors, useQrCode } from '@/stores/qrcode'

/** 预览最大边长（CSS 像素） */
const PREVIEW_MAX = 400

/** 当前设置下的码点排版；内容为空返回 null，超出容量返回错误 */
function useQrLayout() {
  const s = useQrCode()
  const payload = qrPayload(s)
  const { ecc, dots, eyes, shape, margin, logo, logoRatio, logoPlate } = s
  return useMemo(() => {
    if (!payload) return null
    try {
      const matrix = encodeQr(payload, ecc)
      const layout = layoutQr(matrix, {
        dots,
        eyes,
        shape,
        margin,
        logo: logo && { ratio: logoRatio, aspect: logo.bitmap.width / logo.bitmap.height, plate: logoPlate },
      })
      return { matrix, layout, error: null }
    } catch (e) {
      return { matrix: null, layout: null, error: e }
    }
  }, [payload, ecc, dots, eyes, shape, margin, logo, logoRatio, logoPlate])
}

export function QrStage() {
  const s = useQrCode()
  const qr = useQrLayout()
  const t = useMessages().qrcode
  const [boxRef, box] = useElementSize<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const colors = qrColors(s)
  const art = qrArtOptions(s)
  const side = Math.max(160, Math.min(PREVIEW_MAX, box.width - 64, box.height - 64))
  const bg = colors.bg ?? (s.artStyle === 'none' ? '#FFFFFF' : QR_ART_PALETTES[s.artStyle].paper)
  const marks = [colors.fg, colors.fg2, colors.eye].filter((c): c is string => !!c)
  const lowContrast = marks.some((c) => contrastRatio(c, bg) < 3)
  // 反色（浅色码点、深色背景）：部分扫码器不支持
  const inverted = !lowContrast && marks.some((c) => luminance(c) > luminance(bg))

  useEffect(() => {
    const c = canvasRef.current
    if (!c || !qr?.layout) return
    const px = Math.round(side * devicePixelRatio)
    c.width = c.height = px
    const ctx = c.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    ctx.clearRect(0, 0, px, px)
    drawQr(ctx, qr.layout, colors, s.logo?.bitmap ?? null, px, art)
  })

  const copy = async () => {
    try {
      // Safari 要求在用户手势内同步构造 ClipboardItem，内容以 Promise 传入
      const blob = s.render('image/png').then((b) => b ?? Promise.reject(new Error('empty')))
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      toast.success(t.copied)
    } catch {
      toast.error(t.copyFailed)
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      <div ref={boxRef} className="relative grid min-h-0 flex-1 place-items-center p-6">
        {!qr ? (
          <div
            className="grid place-items-center rounded-2xl border border-dashed border-fg/15 bg-panel/60 p-6 text-center"
            style={{ width: side, height: side }}
          >
            <div>
              <QrCode className="mx-auto h-10 w-10 text-muted/50" strokeWidth={1.4} />
              <p className="mt-3 text-[13px] text-muted">{t.empty}</p>
            </div>
          </div>
        ) : qr.error ? (
          <div className="panel max-w-sm p-6 text-center">
            <CircleAlert className="mx-auto h-8 w-8 text-danger" />
            <p className="mt-3 text-[13px] text-muted">{errorMessage(qr.error)}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className={cn('overflow-hidden rounded-[3px] shadow-stage', !colors.bg && 'checker')}>
              <canvas ref={canvasRef} className="block" style={{ width: side, height: side }} />
            </div>
            {qr.matrix && (
              <p className="font-mono text-[11px] tabular-nums text-muted">
                {fmt(t.info, { version: qr.matrix.version, modules: qr.matrix.size, ecc: s.ecc })}
              </p>
            )}
            {s.artStyle !== 'none' && (
              <p className="flex max-w-[400px] items-start gap-1.5 text-[12px] leading-relaxed text-muted">
                <Sparkles className="mt-[3px] h-3.5 w-3.5 shrink-0 text-brand" /> {t.artScanHint}
              </p>
            )}
            {[
              lowContrast && t.lowContrast,
              inverted && t.inverted,
              s.dots !== 'square' && s.dots !== 'rounded' && (qr.matrix?.version ?? 0) > DOTS_MAX_VERSION && t.dotsHint,
            ]
              .filter(Boolean)
              .map((w) => (
                <p key={w as string} className="flex max-w-[400px] items-start gap-1.5 text-[12px] leading-relaxed text-warning">
                  <TriangleAlert className="mt-[3px] h-3.5 w-3.5 shrink-0" /> {w}
                </p>
              ))}
          </div>
        )}
      </div>

      {qr?.layout && typeof ClipboardItem !== 'undefined' && (
        <div className="flex shrink-0 justify-center pb-5 pt-1">
          <div className="flex items-center gap-1 rounded-2xl border border-line/80 bg-panel/90 p-1.5 shadow-soft backdrop-blur">
            <Button size="sm" variant="ghost" onClick={copy}>
              <Copy className="h-3.5 w-3.5" /> {t.copy}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
