import { useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, CircleAlert, Grid2x2, ImagePlus, Loader2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { Dropzone } from '@/components/common/Dropzone'
import { Button } from '@/components/ui/Button'
import { useElementSize } from '@/hooks/useElementSize'
import { cn } from '@/lib/cn'
import { clamp } from '@/lib/format'
import { resolveSpec, useIdPhoto } from '@/stores/idphoto'
import { useComposed } from './useComposed'

const STEPS = [
  { id: 'model', label: '加载 AI 模型' },
  { id: 'segment', label: '人像分割 · 抠除背景' },
  { id: 'face', label: '人脸定位 · 自动构图' },
] as const

const TIPS = ['正面免冠，双眼平视镜头', '光线均匀，避免面部阴影', '背景尽量简洁，衣服与背景色区分开']

export function IdStage() {
  const { status, error, load, sourceName } = useIdPhoto()

  if (status === 'empty')
    return (
      <div className="absolute inset-0 grid place-items-center p-6">
        <div className="w-full max-w-[560px]">
          <Dropzone
            onFiles={(f) => load(f[0])}
            multiple={false}
            className="aspect-[4/3] w-full"
            title="上传一张正面人像照片"
            hint="自动抠图换底、按规格智能构图 · 照片不会上传"
          />
          <div className="mt-5 grid grid-cols-3 gap-3">
            {TIPS.map((t, i) => (
              <div
                key={t}
                className="flex items-start gap-2 rounded-xl border border-line/70 bg-panel/70 p-3 text-[12px] leading-relaxed text-muted"
              >
                <span className="mt-px grid h-4 w-4 shrink-0 place-items-center rounded-full bg-fg font-mono text-[10px] font-semibold text-bg">
                  {i + 1}
                </span>
                {t}
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
          <div className="mt-3 font-semibold">处理失败</div>
          <p className="mt-1 text-[13px] text-muted">{error}</p>
          <Dropzone onFiles={(f) => load(f[0])} multiple={false} compact className="mt-5" title="重新选择照片" hint={sourceName} />
        </div>
      </div>
    )

  if (status !== 'done') return <Analyzing />
  return <Editor />
}

function Analyzing() {
  const status = useIdPhoto((s) => s.status)
  const idx = STEPS.findIndex((s) => s.id === status)
  return (
    <div className="absolute inset-0 grid place-items-center p-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel w-[300px] p-5">
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          <Loader2 className="h-4 w-4 animate-spin text-muted" /> 正在智能处理
        </div>
        <div className="mt-4 space-y-3">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={cn('flex items-center gap-2.5 text-[13px] transition-colors', i <= idx ? 'text-fg' : 'text-muted/60')}
            >
              <span
                className={cn(
                  'grid h-5 w-5 place-items-center rounded-full',
                  i < idx ? 'bg-success text-white' : i === idx ? 'bg-fg/10 text-fg' : 'bg-subtle',
                )}
              >
                {i < idx ? <Check className="h-3 w-3" strokeWidth={3} /> : i === idx ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              </span>
              {s.label}
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-muted">首次使用需下载约 16MB 模型，之后会被浏览器缓存</p>
      </motion.div>
    </div>
  )
}

function Editor() {
  const { specId, customPx, adjust, setAdjust, resetFraming, showGuides, toggleGuides, load } = useIdPhoto()
  const spec = useMemo(() => resolveSpec(specId, customPx), [specId, customPx])
  const composed = useComposed()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [boxRef, box] = useElementSize<HTMLDivElement>()
  const fileInput = useRef<HTMLInputElement>(null)

  const [W, H] = spec.px
  const maxH = Math.max(160, Math.min(box.height - 40, 560))
  const maxW = Math.max(120, box.width - 80)
  const scale = Math.min(maxH / H, maxW / W)
  const cssW = W * scale
  const cssH = H * scale

  useEffect(() => {
    const c = canvasRef.current
    if (!c || !composed) return
    c.width = composed.width
    c.height = composed.height
    c.getContext('2d')!.drawImage(composed, 0, 0)
  }, [composed])

  // 滚轮缩放（需要非 passive 监听才能阻止页面滚动）
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const { adjust: a, setAdjust: set } = useIdPhoto.getState()
      set({ zoom: clamp(a.zoom * (1 - e.deltaY * 0.0015), 0.4, 3) })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const drag = useRef<{ x: number; y: number; dx: number; dy: number } | null>(null)
  const top = spec.topRatio * H
  const [hMin, hMax] = spec.headRatio

  return (
    <div className="absolute inset-0 flex flex-col">
      <div ref={boxRef} className="relative grid min-h-0 flex-1 place-items-center">
        <div className="relative" style={{ width: cssW, height: cssH }}>
          <canvas
            ref={canvasRef}
            className="h-full w-full cursor-grab touch-none rounded-[2px] shadow-stage active:cursor-grabbing"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              drag.current = { x: e.clientX, y: e.clientY, dx: adjust.dx, dy: adjust.dy }
            }}
            onPointerMove={(e) => {
              const d = drag.current
              if (!d) return
              setAdjust({ dx: d.dx + (e.clientX - d.x) / scale, dy: d.dy + (e.clientY - d.y) / scale })
            }}
            onPointerUp={() => (drag.current = null)}
          />
          <AnimatePresence>
            {showGuides && (
              <motion.svg
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                viewBox={`0 0 ${W} ${H}`}
                className="pointer-events-none absolute inset-0 h-full w-full"
              >
                <rect x={0} y={top + hMin * H} width={W} height={(hMax - hMin) * H} fill="rgba(34,211,238,0.10)" />
                <line x1={0} x2={W} y1={top} y2={top} stroke="#22d3ee" strokeWidth={H / 400} strokeDasharray={`${H / 80} ${H / 120}`} />
                <line
                  x1={W / 2}
                  x2={W / 2}
                  y1={0}
                  y2={H}
                  stroke="#22d3ee"
                  strokeOpacity={0.6}
                  strokeWidth={H / 500}
                  strokeDasharray={`${H / 80} ${H / 120}`}
                />
                <text x={W - H / 60} y={top - H / 80} textAnchor="end" fontSize={H / 32} fill="#0891b2" fontWeight={600}>
                  头顶
                </text>
                <text x={W - H / 60} y={top + hMax * H - H / 80} textAnchor="end" fontSize={H / 32} fill="#0891b2" fontWeight={600}>
                  下巴区间
                </text>
              </motion.svg>
            )}
          </AnimatePresence>
          <div className="absolute -bottom-7 left-0 right-0 text-center text-[11px] tabular-nums text-muted">
            {spec.name} · {W}×{H}px
          </div>
        </div>
      </div>

      <div className="flex shrink-0 justify-center pb-5 pt-8">
        <div className="flex items-center gap-1 rounded-2xl border border-line/80 bg-panel/90 p-1.5 shadow-soft backdrop-blur">
          <Button size="icon" variant="ghost" title="缩小" onClick={() => setAdjust({ zoom: clamp(adjust.zoom / 1.08, 0.4, 3) })}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-[12px] font-medium tabular-nums">{Math.round(adjust.zoom * 100)}%</span>
          <Button size="icon" variant="ghost" title="放大" onClick={() => setAdjust({ zoom: clamp(adjust.zoom * 1.08, 0.4, 3) })}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="mx-1 h-5 w-px bg-line" />
          <Button size="sm" variant="ghost" onClick={resetFraming}>
            <RotateCcw className="h-3.5 w-3.5" /> 自动构图
          </Button>
          <Button size="sm" variant={showGuides ? 'soft' : 'ghost'} onClick={toggleGuides}>
            <Grid2x2 className="h-3.5 w-3.5" /> 参考线
          </Button>
          <span className="mx-1 h-5 w-px bg-line" />
          <Button size="sm" variant="ghost" onClick={() => fileInput.current?.click()}>
            <ImagePlus className="h-3.5 w-3.5" /> 换照片
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
