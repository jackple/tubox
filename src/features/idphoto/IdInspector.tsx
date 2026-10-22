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
import { cn } from '@/lib/cn'
import { formatBytes } from '@/lib/format'
import { resolveSpec, useIdPhoto } from '@/stores/idphoto'
import { useComposed } from './useComposed'

const BG_KEYS = Object.keys(backgrounds) as BgKey[]

export function IdInspector() {
  const s = useIdPhoto()
  const spec = useMemo(() => resolveSpec(s.specId, s.customPx), [s.specId, s.customPx])
  const ready = s.status === 'done'
  const [busy, setBusy] = useState<'single' | 'sheet' | null>(null)

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
            {busy !== 'sheet' && <Printer className="h-4 w-4" />} 冲印排版
          </Button>
          <Button variant="primary" onClick={() => exportWith('single')} disabled={!ready} loading={busy === 'single'}>
            {busy !== 'single' && <Download className="h-4 w-4" />} 下载证件照
          </Button>
        </div>
      }
    >
      <Section
        title="背景颜色"
        icon={<Palette className="h-3.5 w-3.5" />}
        extra={
          <label className="mr-2 flex items-center gap-1.5 text-[12px] text-muted" onClick={(e) => e.stopPropagation()}>
            换底
            <Switch checked={s.removeBg} onChange={s.setRemoveBg} />
          </label>
        }
      >
        <div className={cn('space-y-3', !s.removeBg && 'pointer-events-none opacity-40')}>
          <ColorSwatches
            swatches={BG_KEYS.map((k) => ({ id: k, css: backgrounds[k].swatch, label: backgrounds[k].name }))}
            value={s.bg.kind === 'preset' ? s.bg.key : null}
            onChange={(key) => s.setBg({ kind: 'preset', key: key as BgKey })}
            custom={{
              value: s.bg.kind === 'custom' ? s.bg.color : '#5B8DEF',
              active: s.bg.kind === 'custom',
              onChange: (color) => s.setBg({ kind: 'custom', color }),
            }}
          />
          <p className="text-[11px] text-muted">
            {spec.name}通常要求：{spec.backgrounds.map((b) => backgrounds[b].name).join(' / ')}
          </p>
        </div>
      </Section>

      <Section title="构图微调" icon={<Move className="h-3.5 w-3.5" />}>
        <Slider
          label="缩放"
          value={Math.round(s.adjust.zoom * 100)}
          min={40}
          max={300}
          onChange={(v) => s.setAdjust({ zoom: v / 100 })}
          format={(v) => `${v}%`}
        />
        <Slider
          label="旋转"
          value={s.adjust.rotate}
          min={-15}
          max={15}
          step={0.5}
          onChange={(rotate) => s.setAdjust({ rotate })}
          format={(v) => `${v}°`}
        />
        <p className="text-[11px] text-muted">提示：在画面上拖动可平移，滚轮可缩放</p>
      </Section>

      <Section title="美化调色" icon={<SunMedium className="h-3.5 w-3.5" />} defaultOpen={false}>
        <Slider label="亮度" value={s.adjust.brightness} min={-50} max={50} onChange={(brightness) => s.setAdjust({ brightness })} />
        <Slider label="对比度" value={s.adjust.contrast} min={-50} max={50} onChange={(contrast) => s.setAdjust({ contrast })} />
        <Slider label="饱和度" value={s.adjust.saturation} min={-50} max={50} onChange={(saturation) => s.setAdjust({ saturation })} />
        <Slider
          label="色温"
          value={s.adjust.warmth}
          min={-50}
          max={50}
          onChange={(warmth) => s.setAdjust({ warmth })}
          format={(v) => (v > 0 ? `暖 ${v}` : v < 0 ? `冷 ${-v}` : '0')}
        />
      </Section>

      <Section title="导出与检测" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
        <Field label="文件体积上限" hint={spec.minKB ? `下限 ${spec.minKB}KB` : undefined}>
          <NumberInput value={s.maxKB} placeholder="不限制" suffix="KB" min={5} onChange={s.setMaxKB} />
        </Field>
        <Checklist />
        <Field label="冲印相纸">
          <Segmented size="sm" value={s.paperId} onChange={s.setPaper} options={papers.map((p) => ({ value: p.id, label: p.name }))} />
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

  useEffect(() => {
    if (!composed) return setSize(null)
    let off = false
    encodeCanvas(composed, 'image/jpeg', 0.95, s.maxKB).then((r) => !off && setSize(r.blob.size))
    return () => {
      off = true
    }
  }, [composed, s.maxKB])

  if (s.status !== 'done' || !s.analysis || !s.framing)
    return <div className="rounded-xl bg-subtle px-3 py-4 text-center text-[12px] text-muted">上传照片后自动检测是否符合规格</div>

  const ratio = headRatioOf(s.analysis, s.framing, s.adjust, spec.px[1])
  const bgOk = !s.removeBg ? null : s.bg.kind === 'preset' && spec.backgrounds.includes(s.bg.key)
  const kb = size !== null ? size / 1024 : null
  const sizeOk = kb === null ? null : (!s.maxKB || kb <= s.maxKB) && (!spec.minKB || kb >= spec.minKB)

  const rows: { label: string; value: string; ok: boolean | null }[] = [
    { label: '像素尺寸', value: `${spec.px[0]}×${spec.px[1]}`, ok: true },
    {
      label: '头部比例',
      value: `${Math.round(ratio * 100)}%（要求 ${Math.round(spec.headRatio[0] * 100)}-${Math.round(spec.headRatio[1] * 100)}%）`,
      ok: ratio >= spec.headRatio[0] - 0.02 && ratio <= spec.headRatio[1] + 0.02,
    },
    { label: '背景颜色', value: s.removeBg ? (s.bg.kind === 'preset' ? backgrounds[s.bg.key].name : '自定义') : '原背景', ok: bgOk },
    { label: '文件体积', value: size !== null ? formatBytes(size) : '计算中…', ok: sizeOk },
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
        一张相纸可排 <b className="text-fg">{count}</b> 张 · 300 DPI · 含裁切线
      </div>
    </div>
  )
}
