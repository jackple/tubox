import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Download, Move, Palette, Printer, ShieldCheck, SunMedium, TriangleAlert } from 'lucide-react'
import { Inspector } from '@/components/layout/ToolLayout'
import { Button } from '@/components/ui/Button'
import { ColorSwatches } from '@/components/ui/ColorSwatches'
import { Field, NumberInput, Section, Slider, Switch } from '@/components/ui/controls'
import { Segmented } from '@/components/ui/Segmented'
import { encodeCanvas } from '@/core/encode'
import { headRatioOf } from '@/core/idphoto/compose'
import { buildPrintSheet, papers } from '@/core/idphoto/printSheet'
import { type BgKey, backgrounds } from '@/core/idphoto/specs'
import { useDebounced } from '@/hooks/useDebounced'
import { fmt, label, pluralTemplate, rich, useMessages } from '@/i18n'
import { cn } from '@/lib/cn'
import { formatBytes } from '@/lib/format'
import { resolveSpec, specName, useIdPhoto } from '@/stores/idphoto'
import { useComposed } from './useComposed'

const BG_KEYS = Object.keys(backgrounds) as BgKey[]

export function IdInspector() {
  const s = useIdPhoto()
  const spec = useMemo(() => resolveSpec(s.specId, s.customPx), [s.specId, s.customPx])
  const ready = s.status === 'done'
  const [busy, setBusy] = useState<'single' | 'sheet' | null>(null)
  const m = useMessages()
  const t = m.idphoto

  const exportWith = async (kind: 'single' | 'sheet') => {
    setBusy(kind)
    try {
      await (kind === 'single' ? s.exportSingle() : s.exportSheet())
    } finally {
      setBusy(null)
    }
  }

  return (
    <Inspector
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => exportWith('sheet')} disabled={!ready} loading={busy === 'sheet'}>
            {busy !== 'sheet' && <Printer className="h-4 w-4" />} {t.print}
          </Button>
          <Button variant="primary" onClick={() => exportWith('single')} disabled={!ready} loading={busy === 'single'}>
            {busy !== 'single' && <Download className="h-4 w-4" />} {t.downloadPhoto}
          </Button>
        </div>
      }
    >
      <Section
        title={t.bgTitle}
        icon={<Palette className="h-3.5 w-3.5" />}
        extra={
          <label className="mr-2 flex items-center gap-1.5 text-[12px] text-muted" onClick={(e) => e.stopPropagation()}>
            {t.removeBg}
            <Switch checked={s.removeBg} onChange={s.setRemoveBg} />
          </label>
        }
      >
        <div className={cn('space-y-3', !s.removeBg && 'pointer-events-none opacity-40')}>
          <ColorSwatches
            swatches={BG_KEYS.map((k) => ({ id: k, css: backgrounds[k].swatch, label: t.backgrounds[k] }))}
            value={s.bg.kind === 'preset' ? s.bg.key : null}
            onChange={(key) => s.setBg({ kind: 'preset', key: key as BgKey })}
            custom={{
              value: s.bg.kind === 'custom' ? s.bg.color : '#5B8DEF',
              active: s.bg.kind === 'custom',
              onChange: (color) => s.setBg({ kind: 'custom', color }),
            }}
          />
          <p className="text-[11px] text-muted">
            {fmt(t.bgRequired, { spec: specName(m, spec.id), list: spec.backgrounds.map((b) => t.backgrounds[b]).join(' / ') })}
          </p>
        </div>
      </Section>

      <Section title={t.framingTitle} icon={<Move className="h-3.5 w-3.5" />}>
        <Slider
          label={m.common.zoom}
          value={Math.round(s.adjust.zoom * 100)}
          min={40}
          max={300}
          onChange={(v) => s.setAdjust({ zoom: v / 100 })}
          format={(v) => `${v}%`}
        />
        <Slider
          label={m.common.rotate}
          value={s.adjust.rotate}
          min={-15}
          max={15}
          step={0.5}
          onChange={(rotate) => s.setAdjust({ rotate })}
          format={(v) => `${v}°`}
        />
        <p className="text-[11px] text-muted">{t.framingTip}</p>
      </Section>

      <Section title={t.toneTitle} icon={<SunMedium className="h-3.5 w-3.5" />} defaultOpen={false}>
        <Slider
          label={t.brightness}
          value={s.adjust.brightness}
          min={-50}
          max={50}
          onChange={(brightness) => s.setAdjust({ brightness })}
        />
        <Slider label={t.contrast} value={s.adjust.contrast} min={-50} max={50} onChange={(contrast) => s.setAdjust({ contrast })} />
        <Slider
          label={t.saturation}
          value={s.adjust.saturation}
          min={-50}
          max={50}
          onChange={(saturation) => s.setAdjust({ saturation })}
        />
        <Slider
          label={t.warmth}
          value={s.adjust.warmth}
          min={-50}
          max={50}
          onChange={(warmth) => s.setAdjust({ warmth })}
          format={(v) => (v > 0 ? fmt(t.warm, { v }) : v < 0 ? fmt(t.cool, { v: -v }) : '0')}
        />
      </Section>

      <Section title={t.exportTitle} icon={<ShieldCheck className="h-3.5 w-3.5" />}>
        <Field label={t.maxSize} hint={spec.minKB ? fmt(t.minSize, { kb: spec.minKB }) : undefined}>
          <NumberInput value={s.maxKB} placeholder={t.noLimit} suffix="KB" min={5} onChange={s.setMaxKB} />
        </Field>
        <Checklist />
        <Field label={t.paper}>
          <Segmented
            size="sm"
            value={s.paperId}
            onChange={s.setPaper}
            options={papers.map((p) => ({ value: p.id, label: label(t.papers, p.id) }))}
          />
        </Field>
        <SheetPreview />
      </Section>
    </Inspector>
  )
}

function Checklist() {
  const s = useIdPhoto()
  const spec = useMemo(() => resolveSpec(s.specId, s.customPx), [s.specId, s.customPx])
  const composed = useDebounced(useComposed(), 400)
  const [size, setSize] = useState<number | null>(null)
  const m = useMessages()
  const t = m.idphoto

  useEffect(() => {
    if (!composed) return setSize(null)
    let off = false
    encodeCanvas(composed, 'image/jpeg', 0.95, s.maxKB).then((r) => !off && setSize(r.blob.size))
    return () => {
      off = true
    }
  }, [composed, s.maxKB])

  if (s.status !== 'done' || !s.analysis || !s.framing)
    return <div className="rounded-xl bg-subtle px-3 py-4 text-center text-[12px] text-muted">{t.checkEmpty}</div>

  const ratio = headRatioOf(s.analysis, s.framing, s.adjust, spec.px[1])
  const bgOk = !s.removeBg ? null : s.bg.kind === 'preset' && spec.backgrounds.includes(s.bg.key)
  const kb = size !== null ? size / 1024 : null
  const sizeOk = kb === null ? null : (!s.maxKB || kb <= s.maxKB) && (!spec.minKB || kb >= spec.minKB)

  const rows: { label: string; value: string; ok: boolean | null }[] = [
    { label: t.pxSize, value: `${spec.px[0]}×${spec.px[1]}`, ok: true },
    {
      label: t.headRatio,
      value: fmt(t.headRatioValue, {
        value: Math.round(ratio * 100),
        min: Math.round(spec.headRatio[0] * 100),
        max: Math.round(spec.headRatio[1] * 100),
      }),
      ok: ratio >= spec.headRatio[0] - 0.02 && ratio <= spec.headRatio[1] + 0.02,
    },
    { label: t.bgColor, value: s.removeBg ? (s.bg.kind === 'preset' ? t.backgrounds[s.bg.key] : m.common.custom) : t.originalBg, ok: bgOk },
    { label: t.fileSize, value: size !== null ? formatBytes(size) : t.calculating, ok: sizeOk },
  ]
  return (
    <div className="divide-y divide-line/60 rounded-xl border border-line/70">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2.5 px-3 py-2 text-[12px]">
          <span
            className={cn(
              'grid h-4 w-4 shrink-0 place-items-center rounded-full',
              r.ok === true ? 'bg-success text-white' : r.ok === false ? 'bg-warning text-white' : 'bg-subtle text-muted',
            )}
          >
            {r.ok === false ? <TriangleAlert className="h-2.5 w-2.5" strokeWidth={3} /> : <Check className="h-2.5 w-2.5" strokeWidth={3} />}
          </span>
          <span className="text-muted">{r.label}</span>
          <span className="ml-auto truncate text-right font-medium tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  )
}

function SheetPreview() {
  const spec = useIdPhoto((s) => resolveSpec(s.specId, s.customPx).id)
  const paperId = useIdPhoto((s) => s.paperId)
  const composed = useDebounced(useComposed(), 500)
  const ref = useRef<HTMLCanvasElement>(null)
  const [count, setCount] = useState(0)
  const m = useMessages()

  useEffect(() => {
    const c = ref.current
    if (!c || !composed) return
    const st = useIdPhoto.getState()
    const paper = papers.find((p) => p.id === paperId) ?? papers[0]
    const sheet = buildPrintSheet(composed, st.spec(), paper)
    const k = 280 / sheet.canvas.width
    c.width = sheet.canvas.width * k * 2
    c.height = sheet.canvas.height * k * 2
    const ctx = c.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(sheet.canvas, 0, 0, c.width, c.height)
    setCount(sheet.count)
  }, [composed, paperId, spec])

  if (!composed) return null
  return (
    <div className="rounded-xl bg-subtle p-3">
      <canvas ref={ref} className="w-full rounded-md shadow-soft" />
      <div className="mt-2 text-center text-[11px] text-muted">
        {rich(pluralTemplate(m.idphoto.sheetInfo, count), { count: <b className="text-fg">{count}</b> })}
      </div>
    </div>
  )
}
