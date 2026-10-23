import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, CircleAlert, Eye, ImagePlus, Loader2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { Dropzone } from '@/components/common/Dropzone'
import { Button } from '@/components/ui/Button'
import { composeCutout, cutoutRegion } from '@/core/cutout/compose'
import { useElementSize } from '@/hooks/useElementSize'
import { errorMessage, useMessages } from '@/i18n'
import { cn } from '@/lib/cn'
import { cutoutBackground, useCutout } from '@/stores/cutout'

const STEPS = ['model', 'segment'] as const
/** 预览长边上限，导出时按原图分辨率重新合成 */
const PREVIEW_SIZE = 1600

export function CutoutStage() {
  const { status, error, load, sourceName } = useCutout()
  const t = useMessages().cutout

  if (status === 'empty')
    return (
      <div className="absolute inset-0 grid place-items-center p-6">
        <div className="w-full max-w-[560px]">
          <Dropzone onFiles={(f) => load(f[0])} multiple={false} className="aspect-[4/3] w-full" title={t.dropTitle} hint={t.dropHint} />
          {/* 小屏下舞台高度有限，隐藏提示卡片 */}
          <div className="mt-5 hidden grid-cols-3 gap-3 sm:grid">
            {t.tips.map((tip, i) => (
              <div
                key={tip}
                className="flex items-start gap-2 rounded-xl border border-line/70 bg-panel/70 p-3 text-[12px] leading-relaxed text-muted"
              >
                <span className="mt-px grid h-4 w-4 shrink-0 place-items-center rounded-full bg-fg font-mono text-[10px] font-semibold text-bg">
                  {i + 1}
                </span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    )

  if (status === 'error')
    return (
      <div className="absolute inset-0 grid place-items-center p-6">
        <div className="panel max-w-sm p-6 text-center">
          <CircleAlert className="mx-auto h-8 w-8 text-danger" />
          <div className="mt-3 font-semibold">{t.failed}</div>
          <p className="mt-1 text-[13px] text-muted">{error && errorMessage(error)}</p>
          <Dropzone onFiles={(f) => load(f[0])} multiple={false} compact className="mt-5" title={t.reselect} hint={sourceName} />
        </div>
      </div>
    )

  if (status !== 'done') return <Analyzing />
  return <Editor />
}

function Analyzing() {
  const status = useCutout((s) => s.status)
  const progress = useCutout((s) => s.progress)
  const idx = STEPS.findIndex((s) => s === status)
  const t = useMessages().cutout
  return (
    <div className="absolute inset-0 grid place-items-center p-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel w-[300px] p-5">
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          <Loader2 className="h-4 w-4 animate-spin text-muted" /> {t.analyzing}
        </div>
        <div className="mt-4 space-y-3">
          {STEPS.map((s, i) => (
            <div key={s} className={cn('flex items-center gap-2.5 text-[13px] transition-colors', i <= idx ? 'text-fg' : 'text-muted/60')}>
              <span
                className={cn(
                  'grid h-5 w-5 place-items-center rounded-full',
                  i < idx ? 'bg-success text-white' : i === idx ? 'bg-fg/10 text-fg' : 'bg-subtle',
                )}
              >
                {i < idx ? <Check className="h-3 w-3" strokeWidth={3} /> : i === idx ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              </span>
              {t.steps[s]}
              {s === 'model' && i === idx && progress > 0 && progress < 1 && (
                <span className="ml-auto font-mono text-[11px] tabular-nums text-muted">{Math.round(progress * 100)}%</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-muted">{t.modelNote}</p>
      </motion.div>
    </div>
  )
}

function Editor() {
  const [source, matte, bgMode, bgColor, blur, crop, padding] = useCutout(
    useShallow((s) => [s.source, s.matte, s.bgMode, s.bgColor, s.blur, s.crop, s.padding]),
  )
  const load = useCutout((s) => s.load)
  const [showOriginal, setShowOriginal] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [boxRef, box] = useElementSize<HTMLDivElement>()
  const fileInput = useRef<HTMLInputElement>(null)
  const t = useMessages().cutout

  const region = useMemo(
    () => (source ? cutoutRegion(source.width, source.height, matte, crop, padding) : null),
    [source, matte, crop, padding],
  )
  const preview = useMemo(() => {
    if (!source || !matte || !region) return null
    const scale = Math.min(1, PREVIEW_SIZE / Math.max(region.w, region.h))
    return composeCutout(source, matte.canvas, cutoutBackground({ bgMode, bgColor, blur }), region, scale)
  }, [source, matte, region, bgMode, bgColor, blur])

  useEffect(() => {
    const c = canvasRef.current
    if (!c || !preview || !source || !region) return
    c.width = preview.width
    c.height = preview.height
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    if (showOriginal) ctx.drawImage(source, region.x, region.y, region.w, region.h, 0, 0, c.width, c.height)
    else ctx.drawImage(preview, 0, 0)
  }, [preview, showOriginal, source, region])

  const aspect = region ? region.w / region.h : 1
  const maxW = Math.max(120, box.width - 64)
  const maxH = Math.max(120, box.height - 48)
  const cssW = Math.min(maxW, maxH * aspect)
  const cssH = cssW / aspect

  return (
    <div className="absolute inset-0 flex flex-col">
      <div ref={boxRef} className="relative grid min-h-0 flex-1 place-items-center">
        <div className={cn('relative overflow-hidden rounded-[3px] shadow-stage', bgMode === 'none' && !showOriginal && 'checker')}>
          <canvas ref={canvasRef} className="block" style={{ width: cssW, height: cssH }} />
        </div>
      </div>

      <div className="flex shrink-0 justify-center pb-5 pt-4">
        <div className="flex items-center gap-1 rounded-2xl border border-line/80 bg-panel/90 p-1.5 shadow-soft backdrop-blur">
          <Button
            size="sm"
            variant={showOriginal ? 'soft' : 'ghost'}
            className="touch-none select-none"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              setShowOriginal(true)
            }}
            onPointerUp={() => setShowOriginal(false)}
            onPointerCancel={() => setShowOriginal(false)}
          >
            <Eye className="h-3.5 w-3.5" /> {t.holdCompare}
          </Button>
          <span className="mx-1 h-5 w-px bg-line" />
          <Button size="sm" variant="ghost" onClick={() => fileInput.current?.click()}>
            <ImagePlus className="h-3.5 w-3.5" /> {t.changePhoto}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) load(f)
              e.target.value = ''
            }}
          />
        </div>
      </div>
    </div>
  )
}
