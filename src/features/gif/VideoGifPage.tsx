import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Clapperboard, Download, Film, Loader2, Pause, Play, Scan, Scissors, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Dropzone } from '@/components/common/Dropzone'
import { Inspector, ToolLayout } from '@/components/layout/ToolLayout'
import { Button } from '@/components/ui/Button'
import { Chip, Field, NumberInput, Section, Switch } from '@/components/ui/controls'
import { Segmented } from '@/components/ui/Segmented'
import { gifRatios, gifSize, totalDuration } from '@/core/gif/frames'
import {
  MAX_CLIP,
  MAX_VIDEO_FRAMES,
  MIN_CLIP,
  type VideoGifOptions,
  drawCover,
  planVideoFrames,
  videoFpsOptions,
  videoSpeedOptions,
} from '@/core/gif/video'
import { useElementSize } from '@/hooks/useElementSize'
import { errorMessage, fmt, plural, useMessages } from '@/i18n'
import { cn } from '@/lib/cn'
import { VIDEO_ACCEPT, type VideoAsset, closeVideo, openVideo, seekVideo } from '@/lib/video'
import { useVideoGif } from '@/stores/videogif'

const WIDTHS = [320, 480, 640, 800]
const COLORS = [256, 128, 64, 32]
/** 时间轴缩略图数量 */
const THUMBS = 10

const secs = (ms: number) => (ms / 1000).toFixed(1)

/** 秒 → m:ss.s */
function clock(s: number) {
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${m}:${r < 10 ? '0' : ''}${r.toFixed(1)}`
}

export default function VideoGifPage() {
  const { video, loading, load, close, options: o, patch, progress, exportGif, cancelExport } = useVideoGif()
  const m = useMessages()
  const t = m.videogif
  const g = m.gif
  const fileInput = useRef<HTMLInputElement>(null)

  const frames = useMemo(() => planVideoFrames(o), [o])
  const size = gifSize(video ?? undefined, o)
  const tooMany = frames.length > MAX_VIDEO_FRAMES
  const exporting = progress !== null

  return (
    <ToolLayout
      toolId="videogif"
      actions={
        video && (
          <>
            <Button variant="ghost" size="sm" onClick={() => fileInput.current?.click()} loading={loading} disabled={exporting}>
              {!loading && <Clapperboard className="h-4 w-4" />} {t.changeVideo}
            </Button>
            <Button variant="ghost" size="sm" onClick={close} disabled={exporting}>
              <Trash2 className="h-4 w-4" /> {m.common.clear}
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept={VIDEO_ACCEPT}
              className="hidden"
              onChange={(e) => {
                load(Array.from(e.target.files ?? []))
                e.target.value = ''
              }}
            />
          </>
        )
      }
      inspector={
        <Inspector
          footer={
            <div className="space-y-2.5">
              <p className={cn('text-center text-[11px]', tooMany ? 'text-danger' : 'text-muted')}>
                {!video
                  ? t.needVideo
                  : tooMany
                    ? fmt(t.tooManyFrames, { max: MAX_VIDEO_FRAMES })
                    : `${size.width}×${size.height}px · ${plural(g.frames, frames.length)} · ${secs(totalDuration(frames))}s`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={!video || tooMany || !frames.length}
                  loading={exporting}
                  onClick={() => exportGif().catch((e) => toast.error(m.common.exportFailed, { description: errorMessage(e) }))}
                >
                  {exporting ? (
                    fmt(g.exporting, { pct: Math.round(progress * 100) })
                  ) : (
                    <>
                      <Download className="h-4 w-4" /> {g.export}
                    </>
                  )}
                </Button>
                {exporting && (
                  <Button variant="secondary" onClick={cancelExport}>
                    <X className="h-4 w-4" /> {t.cancel}
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <Section title={t.clipTitle} icon={<Scissors className="h-3.5 w-3.5" />}>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  [t.clipStart, o.start],
                  [t.clipEnd, o.end],
                  [t.clipLength, o.end - o.start],
                ] as const
              ).map(([label, v]) => (
                <div key={label} className="rounded-lg bg-fg/[0.04] px-2.5 py-2">
                  <div className="text-[11px] text-muted">{label}</div>
                  <div className="mt-0.5 font-mono text-[13px] tabular-nums">{video ? clock(v) : '—'}</div>
                </div>
              ))}
            </div>
            <p className="text-[12px] leading-relaxed text-muted">{fmt(t.clipHint, { max: MAX_CLIP })}</p>
          </Section>

          <Section title={g.playTitle} icon={<Film className="h-3.5 w-3.5" />}>
            <Field label={t.fps}>
              <div className="flex flex-wrap gap-1.5">
                {videoFpsOptions.map((fps) => (
                  <Chip key={fps} active={o.fps === fps} onClick={() => patch({ fps })}>
                    {fps}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label={t.speed}>
              <Segmented
                value={String(o.speed)}
                onChange={(v) => patch({ speed: Number(v) })}
                options={videoSpeedOptions.map((s) => ({ value: String(s), label: `${s}×` }))}
              />
            </Field>
            <label className="flex items-center justify-between text-[13px]">
              {g.pingpong}
              <Switch checked={o.pingpong} onChange={(pingpong) => patch({ pingpong })} />
            </label>
            <label className="flex items-center justify-between text-[13px]">
              {g.loop}
              <Switch checked={o.loop} onChange={(loop) => patch({ loop })} />
            </label>
          </Section>

          <Section title={g.frameTitle} icon={<Scan className="h-3.5 w-3.5" />}>
            <Field label={g.ratio}>
              <div className="flex flex-wrap gap-1.5">
                {gifRatios.map((r) => (
                  <Chip key={r} active={o.ratio === r} onClick={() => patch({ ratio: r })}>
                    {r === 'auto' ? t.ratioAuto : r}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label={g.outWidth}>
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

          <Section title={g.qualityTitle} icon={<SlidersHorizontal className="h-3.5 w-3.5" />}>
            <Field label={g.colors}>
              <Segmented
                value={String(o.colors)}
                onChange={(v) => patch({ colors: Number(v) })}
                options={COLORS.map((c) => ({ value: String(c), label: c }))}
              />
            </Field>
            <p className="text-[12px] leading-relaxed text-muted">{t.sizeHint}</p>
          </Section>
        </Inspector>
      }
    >
      {video ? (
        <VideoStage key={video.id} video={video} />
      ) : loading ? (
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> {t.loading}
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 grid place-items-center p-6">
          <Dropzone
            onFiles={load}
            multiple={false}
            accept={VIDEO_ACCEPT}
            formats="MP4 · WEBM · MOV"
            icon={Clapperboard}
            className="aspect-[4/3] w-full max-w-[560px]"
            title={t.dropTitle}
            hint={t.dropHint}
          />
        </div>
      )}
    </ToolLayout>
  )
}

type DragKind = 'start' | 'end' | 'range' | 'seek'

/**
 * 预览：隐藏的 video 按设定速度播放，按输出帧率把画面裁切绘制到画布，节奏接近导出的 GIF；
 * 往返播放的倒放段逐帧 seek 模拟。
 */
function VideoStage({ video }: { video: VideoAsset }) {
  const o = useVideoGif((s) => s.options)
  const patch = useVideoGif((s) => s.patch)
  const exporting = useVideoGif((s) => s.progress !== null)
  const t = useMessages().gif
  const [boxRef, box] = useElementSize<HTMLDivElement>()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playing, setPlaying] = useState(true)
  const [time, setTime] = useState(o.start)
  // 播放循环读取最新参数，拖动时间轴时不必重启循环
  const opts = useRef(o)
  opts.current = o
  const scrubbing = useRef(false)

  const size = gifSize(video, o)
  const scale = Math.min((box.width - 64) / size.width, (box.height - 32) / size.height)
  const cssW = Math.max(1, size.width * scale)
  const cssH = Math.max(1, size.height * scale)
  // 预览按显示尺寸 × DPR 渲染（不超过源视频裁切区域的分辨率），细节清晰可辨；导出按输出尺寸
  const cover = Math.max(size.width / video.width, size.height / video.height)
  const k = Math.min(scale * (window.devicePixelRatio || 1), 1 / cover)
  const pw = Math.max(1, Math.round(size.width * k))
  const ph = Math.max(1, Math.round(size.height * k))

  const draw = useCallback(() => {
    const v = videoRef.current
    const c = canvasRef.current
    if (!v || !c || v.readyState < 2) return
    const ctx = c.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    drawCover(ctx, v, video.width, video.height, c.width, c.height)
  }, [video])

  useEffect(() => {
    const c = canvasRef.current
    if (!c || scale <= 0) return
    c.width = pw
    c.height = ph
    draw()
  }, [pw, ph, scale, draw])

  const active = playing && !exporting
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (!active) return void v.pause()
    const play = () => void v.play().catch(() => setPlaying(false))
    let raf = 0
    let last = 0
    let reverse = false
    const { start, end } = opts.current
    if (v.currentTime < start || v.currentTime >= end) v.currentTime = start
    play()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const { start, end, fps, speed, pingpong } = opts.current
      if (scrubbing.current || now - last < 1000 / fps) return
      const dt = Math.min(0.2, (now - (last || now)) / 1000)
      last = now
      v.playbackRate = speed
      if (reverse) {
        // 倒放：暂停后按速度逐帧往回 seek，画面在 seeked 时绘制
        if (v.seeking) return
        const next = v.currentTime - dt * speed
        if (next <= start || !pingpong) {
          reverse = false
          v.currentTime = start
          play()
        } else v.currentTime = next
      } else if (v.currentTime >= end || v.ended) {
        if (pingpong) {
          reverse = true
          v.pause()
        } else {
          v.currentTime = start
          if (v.paused) play()
        }
      } else if (v.currentTime < start) {
        v.currentTime = start
      } else draw()
      setTime(v.currentTime)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, draw])

  const scrub = (at: number) => {
    const v = videoRef.current
    if (!v) return
    scrubbing.current = true
    v.pause()
    v.currentTime = at
    setTime(at)
  }

  const scrubEnd = (kind: DragKind) => {
    scrubbing.current = false
    const v = videoRef.current
    if (!v) return
    // 调整终点后从结尾前 1 秒播放，便于确认收尾画面
    if (kind === 'end') v.currentTime = Math.max(opts.current.start, opts.current.end - 1)
    else if (kind !== 'seek') v.currentTime = opts.current.start
    if (active) void v.play().catch(() => setPlaying(false))
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      <div ref={boxRef} className="grid min-h-0 flex-1 place-items-center">
        <canvas ref={canvasRef} className="block rounded-[3px] bg-black shadow-stage" style={{ width: cssW, height: cssH }} />
      </div>
      <video
        ref={videoRef}
        src={video.url}
        muted
        playsInline
        preload="auto"
        className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
        onLoadedData={draw}
        onSeeked={draw}
      />
      <div className="flex shrink-0 justify-center px-4 pb-5 pt-2">
        <div className="flex w-full max-w-[760px] items-center gap-2 rounded-2xl border border-line/80 bg-panel/90 p-2 shadow-soft backdrop-blur">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setPlaying(!playing)}
            disabled={exporting}
            aria-label={playing ? t.pause : t.play}
            title={playing ? t.pause : t.play}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <TrimBar
            video={video}
            options={o}
            time={time}
            disabled={exporting}
            onChange={(start, end) => patch({ start, end })}
            onScrub={scrub}
            onScrubEnd={scrubEnd}
          />
        </div>
      </div>
    </div>
  )
}

/** 时间轴：缩略图 + 可拖动的起止手柄；拖动选区整体平移，点击选区内跳转 */
function TrimBar({
  video,
  options: o,
  time,
  disabled,
  onChange,
  onScrub,
  onScrubEnd,
}: {
  video: VideoAsset
  options: VideoGifOptions
  time: number
  disabled?: boolean
  onChange: (start: number, end: number) => void
  onScrub: (at: number) => void
  onScrubEnd: (kind: DragKind) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ kind: DragKind; x0: number; t0: number; s0: number; e0: number; moved: boolean } | null>(null)
  const d = video.duration
  const pct = (s: number) => `${(Math.min(Math.max(s / d, 0), 1) * 100).toFixed(3)}%`

  const timeAt = (clientX: number) => {
    const r = trackRef.current!.getBoundingClientRect()
    return Math.min(Math.max((clientX - r.left) / r.width, 0), 1) * d
  }

  const apply = (at: number) => {
    const g = drag.current!
    if (g.kind === 'start') {
      const s = Math.max(0, g.e0 - MAX_CLIP, Math.min(at, g.e0 - MIN_CLIP))
      onChange(s, g.e0)
      onScrub(s)
    } else if (g.kind === 'end') {
      const e = Math.min(d, g.s0 + MAX_CLIP, Math.max(at, g.s0 + MIN_CLIP))
      onChange(g.s0, e)
      onScrub(e)
    } else if (g.kind === 'range') {
      const len = g.e0 - g.s0
      const s = Math.min(Math.max(g.s0 + at - g.t0, 0), d - len)
      onChange(s, s + len)
      onScrub(s)
    } else onScrub(Math.min(Math.max(at, g.s0), g.e0))
  }

  const end = () => {
    const g = drag.current
    if (!g) return
    if (g.kind === 'range' && !g.moved) {
      g.kind = 'seek'
      apply(g.t0)
    }
    drag.current = null
    onScrubEnd(g.kind)
  }

  return (
    <div className={cn('min-w-0 flex-1 px-3', disabled && 'pointer-events-none opacity-60')}>
      <div
        ref={trackRef}
        className="relative h-11 cursor-pointer touch-none select-none"
        onPointerDown={(e) => {
          if (e.button !== 0) return
          const el = (e.target as HTMLElement).closest<HTMLElement>('[data-kind]')
          const kind = (el?.dataset.kind as DragKind | undefined) ?? 'seek'
          e.currentTarget.setPointerCapture(e.pointerId)
          drag.current = { kind, x0: e.clientX, t0: timeAt(e.clientX), s0: o.start, e0: o.end, moved: false }
          // 选区内单击视为跳转，移动超过阈值才开始平移
          if (kind !== 'range') apply(timeAt(e.clientX))
        }}
        onPointerMove={(e) => {
          const g = drag.current
          if (!g) return
          if (!g.moved && g.kind === 'range' && Math.abs(e.clientX - g.x0) < 4) return
          g.moved = true
          apply(timeAt(e.clientX))
        }}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <Filmstrip video={video} />
        {/* 选区外压暗 */}
        <div className="pointer-events-none absolute inset-y-0 left-0 rounded-l-lg bg-panel/75" style={{ width: pct(o.start) }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 rounded-r-lg bg-panel/75" style={{ left: pct(o.end) }} />
        <div
          data-kind="range"
          className="absolute inset-y-0 cursor-grab border-y-2 border-brand active:cursor-grabbing"
          style={{ left: pct(o.start), right: `calc(100% - ${pct(o.end)})` }}
        />
        {(['start', 'end'] as const).map((kind) => (
          <div
            key={kind}
            data-kind={kind}
            className={cn(
              'absolute inset-y-0 grid w-3 cursor-ew-resize place-items-center bg-brand',
              kind === 'start' ? '-translate-x-full rounded-l-md' : 'rounded-r-md',
            )}
            style={{ left: pct(kind === 'start' ? o.start : o.end) }}
          >
            <span className="h-4 w-0.5 rounded-full bg-white/85" />
          </div>
        ))}
        <div
          className="pointer-events-none absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-fg shadow-[0_0_0_1px_rgb(var(--panel))]"
          style={{ left: pct(time) }}
        />
      </div>
      <div className="mt-1.5 flex justify-between px-0.5 font-mono text-[10px] tabular-nums text-muted">
        <span>{clock(0)}</span>
        <span className="text-fg">
          {clock(Math.max(0, time - o.start))} / {clock(o.end - o.start)}
        </span>
        <span>{clock(d)}</span>
      </div>
    </div>
  )
}

/** 均匀抽取缩略图：用独立的 video 元素逐张 seek，不影响预览播放 */
function Filmstrip({ video }: { video: VideoAsset }) {
  const refs = useRef<(HTMLCanvasElement | null)[]>([])

  useEffect(() => {
    let alive = true
    let el: HTMLVideoElement | null = null
    const th = 72
    const tw = Math.min(160, Math.round((th * video.width) / video.height))
    ;(async () => {
      el = await openVideo(video.url)
      for (let i = 0; i < THUMBS && alive; i++) {
        await seekVideo(el, ((i + 0.5) / THUMBS) * video.duration)
        const c = refs.current[i]
        if (!c || !alive) continue
        c.width = tw
        c.height = th
        drawCover(c.getContext('2d')!, el, video.width, video.height, tw, th)
      }
    })()
      .catch(() => {})
      .finally(() => el && closeVideo(el))
    return () => {
      alive = false
    }
  }, [video])

  return (
    <div className="pointer-events-none absolute inset-0 flex gap-px overflow-hidden rounded-lg bg-subtle">
      {Array.from({ length: THUMBS }, (_, i) => (
        <canvas key={i} ref={(c) => void (refs.current[i] = c)} className="h-full min-w-0 flex-1 object-cover" />
      ))}
    </div>
  )
}
