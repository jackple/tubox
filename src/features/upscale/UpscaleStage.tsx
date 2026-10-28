import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronsLeftRight, CircleAlert, ImagePlus, Loader2, Minus, Plus, Scan } from 'lucide-react'
import { Dropzone } from '@/components/common/Dropzone'
import { Button } from '@/components/ui/Button'
import { useElementSize } from '@/hooks/useElementSize'
import { errorMessage, fmt, useMessages } from '@/i18n'
import { cn } from '@/lib/cn'
import { clamp } from '@/lib/format'
import { useUpscale } from '@/stores/upscale'

const STEPS = ['model', 'upscale'] as const
/** 舞台四周留白 */
const INSET = 48
const MAX_ZOOM = 8

export function UpscaleStage() {
  const { status, error, load, sourceName, source } = useUpscale()
  const t = useMessages().upscale

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

  if (!source) {
    if (status !== 'empty') return <Progress />
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
  }

  return (
    <>
      <Viewer />
      {(status === 'model' || status === 'upscale') && <Progress />}
    </>
  )
}

function Progress() {
  const { status, progress, startedAt, cancel } = useUpscale()
  const idx = STEPS.findIndex((s) => s === status)
  const t = useMessages().upscale
  const elapsed = (performance.now() - startedAt) / 1000
  const remaining = status === 'upscale' && progress > 0.04 && progress < 1 ? Math.ceil((elapsed / progress) * (1 - progress)) : 0
  const gpu = typeof navigator !== 'undefined' && 'gpu' in navigator
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-bg/40 p-6 backdrop-blur-[2px]">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel w-[320px] p-5">
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          <Loader2 className="h-4 w-4 animate-spin text-muted" /> {t.processing}
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
              {i === idx && progress > 0 && progress < 1 && (
                <span className="ml-auto font-mono text-[11px] tabular-nums text-muted">{Math.round(progress * 100)}%</span>
              )}
            </div>
          ))}
        </div>
        {status === 'upscale' && (
          <div className="mt-4">
            <div className="h-1 overflow-hidden rounded-full bg-fg/[0.08]">
              <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
            </div>
            <div className="mt-1.5 h-4 text-right font-mono text-[11px] tabular-nums text-muted">
              {remaining > 0 && fmt(t.remaining, { secs: remaining })}
            </div>
          </div>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-muted">{gpu ? t.modelNote : t.cpuNote}</p>
        <Button size="sm" className="mt-4 w-full" onClick={cancel}>
          {t.cancel}
        </Button>
      </motion.div>
    </div>
  )
}

interface View {
  z: number
  x: number
  y: number
}

/** 前后对比查看器：拖动分割线对比，滚轮 / 按钮缩放，放大后拖动平移 */
function Viewer() {
  const source = useUpscale((s) => s.source)!
  const result = useUpscale((s) => s.result)
  const alpha = useUpscale((s) => s.alpha)
  const load = useUpscale((s) => s.load)
  const t = useMessages().upscale
  const [boxRef, box] = useElementSize<HTMLDivElement>()
  const beforeRef = useRef<HTMLCanvasElement>(null)
  const afterRef = useRef<HTMLCanvasElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [split, setSplit] = useState(50)
  /** null 为适应窗口 */
  const [view, setView] = useState<View | null>(null)

  // 以输出像素为内容坐标；尚无结果时为原图
  const cw = result?.canvas.width ?? source.width
  const ch = result?.canvas.height ?? source.height
  const fit = box.width > 0 ? Math.max(0.01, Math.min((box.width - INSET) / cw, (box.height - INSET) / ch)) : 0
  const z = view?.z ?? fit
  const place = (zoom: number, x: number, y: number) => {
    const w = cw * zoom
    const h = ch * zoom
    return {
      x: w <= box.width ? (box.width - w) / 2 : clamp(x, box.width - w, 0),
      y: h <= box.height ? (box.height - h) / 2 : clamp(y, box.height - h, 0),
    }
  }
  const pos = place(z, view?.x ?? 0, view?.y ?? 0)
  const overflow = cw * z > box.width + 1 || ch * z > box.height + 1

  useEffect(() => setView(null), [cw, ch])

  useEffect(() => {
    const c = beforeRef.current
    if (!c) return
    c.width = source.width
    c.height = source.height
    c.getContext('2d')!.drawImage(source, 0, 0)
  }, [source])

  useEffect(() => {
    const c = afterRef.current
    if (!c || !result) return
    c.width = result.canvas.width
    c.height = result.canvas.height
    c.getContext('2d')!.drawImage(result.canvas, 0, 0)
    // 卸载 / 换结果时释放显示画布
    return () => {
      c.width = c.height = 0
    }
  }, [result])

  /** 以视口内一点为中心缩放 */
  const zoomAt = (next: number, px: number, py: number) => {
    // 缩小到适应窗口以下时回到「适应」状态
    const nz = Math.min(next, Math.max(MAX_ZOOM, fit))
    if (nz <= fit) return setView(null)
    const u = (px - pos.x) / z
    const v = (py - pos.y) / z
    setView({ z: nz, x: px - u * nz, y: py - v * nz })
  }
  const zoomRef = useRef(zoomAt)
  zoomRef.current = zoomAt

  // React 的 wheel 监听是 passive，无法阻止页面滚动，手动注册
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoomRef.current(z * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [boxRef, z])

  const drag = useRef<{ mode: 'split' | 'pan'; sx: number; sy: number; ox: number; oy: number } | null>(null)
  const moveSplit = (clientX: number) => {
    const r = boxRef.current!.getBoundingClientRect()
    setSplit(clamp(((clientX - r.left) / r.width) * 100, 0, 100))
  }

  const rect = { left: pos.x, top: pos.y, width: cw * z, height: ch * z }
  const pct = Math.round(z * 100)

  return (
    <div className="absolute inset-0 flex flex-col">
      <div
        ref={boxRef}
        className={cn(
          'relative min-h-0 flex-1 touch-none select-none overflow-hidden',
          overflow ? 'cursor-grab active:cursor-grabbing' : result && 'cursor-ew-resize',
        )}
        onPointerDown={(e) => {
          const onHandle = !!(e.target as HTMLElement).closest('[data-split]')
          if (result && (onHandle || !overflow)) {
            drag.current = { mode: 'split', sx: 0, sy: 0, ox: 0, oy: 0 }
            moveSplit(e.clientX)
          } else if (overflow) drag.current = { mode: 'pan', sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y }
          else return
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          if (d.mode === 'split') moveSplit(e.clientX)
          else setView({ z, x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy })
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <div className={cn('absolute shadow-stage', alpha && 'checker')} style={rect} />
        {result && <canvas ref={afterRef} className="absolute block" style={rect} />}
        <div className="absolute inset-0" style={result ? { clipPath: `inset(0 ${100 - split}% 0 0)` } : undefined}>
          <canvas ref={beforeRef} className="absolute block" style={rect} />
        </div>

        {result && (
          <>
            {/* 分割线只覆盖图片在视口内可见的部分 */}
            <div
              className="pointer-events-none absolute"
              style={{ left: `${split}%`, top: Math.max(0, pos.y), height: Math.min(box.height, pos.y + ch * z) - Math.max(0, pos.y) }}
            >
              <div className="absolute inset-y-0 -ml-px w-0.5 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.15)]" />
              <div
                data-split
                className="pointer-events-auto absolute top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full bg-white shadow-lift"
              >
                <ChevronsLeftRight className="h-4 w-4 text-neutral-700" />
              </div>
            </div>
            <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur">
              {t.before}
            </span>
            <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-medium text-neutral-900 backdrop-blur">
              {t.after} · {result.scale}×
            </span>
          </>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2 pb-5 pt-3">
        {result && <p className="hidden text-[11px] text-muted sm:block">{t.viewHint}</p>}
        <div className="flex items-center gap-1 rounded-2xl border border-line/80 bg-panel/90 p-1.5 shadow-soft backdrop-blur">
          <Button size="icon" variant="ghost" title={t.zoomOut} onClick={() => zoomAt(z / 1.5, box.width / 2, box.height / 2)}>
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <button
            type="button"
            title={view ? t.fit : t.actual}
            className="h-8 w-14 rounded-lg font-mono text-[12px] tabular-nums text-muted transition-colors hover:bg-subtle hover:text-fg"
            onClick={() => (view ? setView(null) : zoomAt(1, box.width / 2, box.height / 2))}
          >
            {pct}%
          </button>
          <Button size="icon" variant="ghost" title={t.zoomIn} onClick={() => zoomAt(z * 1.5, box.width / 2, box.height / 2)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant={view ? 'ghost' : 'soft'} title={t.fit} onClick={() => setView(null)}>
            <Scan className="h-3.5 w-3.5" />
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
