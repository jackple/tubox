import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, Film, Pause, Play, Scan, SlidersHorizontal, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ImageStrip } from '@/components/common/ImageStrip'
import { Inspector, ToolLayout } from '@/components/layout/ToolLayout'
import { Button } from '@/components/ui/Button'
import { ColorSwatches } from '@/components/ui/ColorSwatches'
import { Chip, Field, NumberInput, Section, Slider, Switch } from '@/components/ui/controls'
import { Segmented } from '@/components/ui/Segmented'
import {
  type GifFit,
  type GifOptions,
  type GifTransition,
  drawFrame,
  gifRatios,
  gifSize,
  planFrames,
  totalDuration,
} from '@/core/gif/frames'
import { useElementSize } from '@/hooks/useElementSize'
import { errorMessage, fmt, plural, useMessages } from '@/i18n'
import type { ImageAsset } from '@/lib/assets'
import { GIF_MAX_IMAGES, useGif } from '@/stores/gif'
import { EmptyStage } from '../collage/shared'

/** 背景色预设（图片内容色，不随主题变化） */
const BG_COLORS = ['#FFFFFF', '#000000', '#F5F0E8', '#EEF0F5', '#111114', '#FDE2E4']
const WIDTHS = [320, 480, 640, 800]
const COLORS = [256, 128, 64, 32]

const secs = (ms: number) => (ms / 1000).toFixed(1)

export default function GifPage() {
  const { images, add, remove, move, clear, options: o, patch, progress, exportGif } = useGif()
  const m = useMessages()
  const t = m.gif

  const size = gifSize(images[0], o)
  const frames = useMemo(() => planFrames(images.length, o), [images.length, o])
  const activeBg = BG_COLORS.find((c) => c.toLowerCase() === o.background.toLowerCase())

  return (
    <ToolLayout
      toolId="gif"
      actions={
        images.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear} disabled={progress !== null}>
            <Trash2 className="h-4 w-4" /> {m.common.clear}
          </Button>
        )
      }
      left={images.length > 0 && <ImageStrip images={images} onAdd={add} onRemove={remove} onMove={move} max={GIF_MAX_IMAGES} />}
      inspector={
        <Inspector
          footer={
            <div className="space-y-2.5">
              <p className="text-center text-[11px] text-muted">
                {images.length
                  ? `${size.width}×${size.height}px · ${plural(t.frames, frames.length)} · ${secs(totalDuration(frames))}s`
                  : t.needImages}
              </p>
              <Button
                variant="primary"
                className="w-full"
                disabled={!images.length}
                loading={progress !== null}
                onClick={() => exportGif().catch((e) => toast.error(m.common.exportFailed, { description: errorMessage(e) }))}
              >
                {progress === null ? (
                  <>
                    <Download className="h-4 w-4" /> {t.export}
                  </>
                ) : (
                  fmt(t.exporting, { pct: Math.round(progress * 100) })
                )}
              </Button>
            </div>
          }
        >
          <Section title={t.playTitle} icon={<Film className="h-3.5 w-3.5" />}>
            <Slider
              label={t.frameDelay}
              value={o.delay}
              min={100}
              max={3000}
              step={50}
              onChange={(delay) => patch({ delay })}
              format={(v) => `${secs(v)}s`}
            />
            <Field label={t.transition}>
              <Segmented<GifTransition>
                value={o.transition}
                onChange={(transition) => patch({ transition })}
                options={(['none', 'fade'] as const).map((k) => ({ value: k, label: t.transitions[k] }))}
              />
            </Field>
            <label className="flex items-center justify-between text-[13px]">
              {t.pingpong}
              <Switch checked={o.pingpong} onChange={(pingpong) => patch({ pingpong })} />
            </label>
            <label className="flex items-center justify-between text-[13px]">
              {t.loop}
              <Switch checked={o.loop} onChange={(loop) => patch({ loop })} />
            </label>
          </Section>

          <Section title={t.frameTitle} icon={<Scan className="h-3.5 w-3.5" />}>
            <Field label={t.ratio}>
              <div className="flex flex-wrap gap-1.5">
                {gifRatios.map((r) => (
                  <Chip key={r} active={o.ratio === r} onClick={() => patch({ ratio: r })}>
                    {r === 'auto' ? t.ratioAuto : r}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label={t.fit}>
              <Segmented<GifFit>
                value={o.fit}
                onChange={(fit) => patch({ fit })}
                options={(['cover', 'contain'] as const).map((k) => ({ value: k, label: t.fits[k] }))}
              />
            </Field>
            {o.fit === 'contain' && (
              <Field label={m.common.background}>
                <ColorSwatches
                  size="sm"
                  swatches={BG_COLORS.map((c) => ({ id: c, css: c }))}
                  value={activeBg ?? null}
                  onChange={(background) => patch({ background })}
                  custom={{ value: o.background, active: !activeBg, onChange: (background) => patch({ background }) }}
                />
              </Field>
            )}
            <Field label={t.outWidth}>
              <NumberInput value={o.width} min={64} max={1920} suffix="px" onChange={(v) => patch({ width: Math.min(1920, v ?? 480) })} />
            </Field>
            <div className="flex flex-wrap gap-1.5">
              {WIDTHS.map((w) => (
                <Chip key={w} active={o.width === w} onClick={() => patch({ width: w })}>
                  {w}
                </Chip>
              ))}
            </div>
          </Section>

          <Section title={t.qualityTitle} icon={<SlidersHorizontal className="h-3.5 w-3.5" />}>
            <Field label={t.colors}>
              <Segmented
                value={String(o.colors)}
                onChange={(v) => patch({ colors: Number(v) })}
                options={COLORS.map((c) => ({ value: String(c), label: c }))}
              />
            </Field>
            <p className="text-[12px] leading-relaxed text-muted">{t.colorsHint}</p>
          </Section>
        </Inspector>
      }
    >
      {images.length ? <GifPreview images={images} options={o} /> : <EmptyStage onFiles={add} title={t.emptyTitle} hint={t.emptyHint} />}
    </ToolLayout>
  )
}

/** 实时预览：按帧序列逐帧绘制到显示尺寸的画布，与导出共用 drawFrame */
function GifPreview({ images, options: o }: { images: ImageAsset[]; options: GifOptions }) {
  const [boxRef, box] = useElementSize<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playing, setPlaying] = useState(true)
  const [index, setIndex] = useState(0)
  const t = useMessages().gif

  const frames = useMemo(() => planFrames(images.length, o), [images.length, o])
  const size = gifSize(images[0], o)
  const scale = Math.min((box.width - 64) / size.width, (box.height - 120) / size.height)
  const cssW = Math.max(1, size.width * scale)
  const cssH = Math.max(1, size.height * scale)
  const cur = frames.length ? index % frames.length : 0

  // 播放：每帧按自身时长切换
  useEffect(() => {
    if (!playing || frames.length < 2) return
    const timer = setTimeout(() => setIndex((i) => (i + 1) % frames.length), frames[cur].delay)
    return () => clearTimeout(timer)
  }, [playing, frames, cur])

  useEffect(() => {
    const c = canvasRef.current
    if (!c || !frames.length || scale <= 0) return
    const dpr = window.devicePixelRatio || 1
    // 预览不超过输出分辨率
    const k = Math.min(1, scale * dpr)
    const w = Math.max(1, Math.round(size.width * k))
    const h = Math.max(1, Math.round(size.height * k))
    if (c.width !== w || c.height !== h) {
      c.width = w
      c.height = h
    }
    const ctx = c.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    drawFrame(
      ctx,
      images.map((i) => i.bitmap),
      frames[cur],
      w,
      h,
      o,
    )
  }, [images, frames, cur, o, scale, size.width, size.height])

  return (
    <div ref={boxRef} className="absolute inset-0 flex flex-col">
      <div className="grid min-h-0 flex-1 place-items-center">
        <canvas ref={canvasRef} className="block rounded-[3px] shadow-stage" style={{ width: cssW, height: cssH }} />
      </div>
      <div className="flex shrink-0 justify-center pb-5 pt-2">
        <div className="flex items-center gap-1 rounded-2xl border border-line/80 bg-panel/90 p-1.5 shadow-soft backdrop-blur">
          <Button size="sm" variant="ghost" onClick={() => setPlaying(!playing)} disabled={frames.length < 2}>
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? t.pause : t.play}
          </Button>
          <span className="mx-1 h-5 w-px bg-line" />
          <span className="px-2 font-mono text-[11px] tabular-nums text-muted">
            {frames.length ? `${frames[cur].a + 1} / ${images.length}` : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
