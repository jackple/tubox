import { useEffect, useRef, useState } from 'react'
import { FileType2, ImageUp, Maximize2, PenLine, Play, RotateCcw, Stamp } from 'lucide-react'
import { Inspector } from '@/components/layout/ToolLayout'
import { Button } from '@/components/ui/Button'
import { ColorSwatches } from '@/components/ui/ColorSwatches'
import { Chip, Field, Input, NumberInput, Section, Slider, Switch } from '@/components/ui/controls'
import { Segmented } from '@/components/ui/Segmented'
import { supportsEncode } from '@/core/canvas'
import { renameTokens, renderFileName } from '@/core/batch/rename'
import type { Anchor, OutputFormat, ResizeMode } from '@/core/batch/types'
import { cn } from '@/lib/cn'
import { batchPresets, useBatch } from '@/stores/batch'
import { LivePreview } from './LivePreview'

const MODES: { id: ResizeMode; name: string }[] = [
  { id: 'long', name: '长边' },
  { id: 'fit', name: '适应框' },
  { id: 'cover', name: '裁切填充' },
  { id: 'exact', name: '拉伸' },
  { id: 'width', name: '固定宽' },
  { id: 'height', name: '固定高' },
  { id: 'scale', name: '百分比' },
]

const WM_COLORS = ['#ffffff', '#111111', '#6859ff', '#ff5c93', '#f5b400']

export function BatchInspector() {
  const { options: o, patch, applyPreset, reset, run, running, progress, items, version } = useBatch()
  const stale = items.some((i) => !i.result || i.result.version !== version)

  return (
    <Inspector
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={reset} title="恢复默认参数">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="primary" className="flex-1" onClick={run} loading={running} disabled={!items.length || !stale}>
            {!running && <Play className="h-3.5 w-3.5 fill-current" />}
            {running
              ? `处理中 ${progress.done} / ${progress.total}`
              : !items.length
                ? '请先添加图片'
                : stale
                  ? `开始处理 ${items.length} 张`
                  : '已全部处理 ✓'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 border-b border-line/70 p-5">
        <LivePreview />
        <div>
          <div className="label mb-2">快捷预设</div>
          <div className="flex flex-wrap gap-1.5">
            {batchPresets.map((p) => (
              <Chip key={p.id} onClick={() => applyPreset(p)}>
                <span title={p.hint}>{p.name}</span>
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <Section
        title="统一尺寸"
        icon={<Maximize2 className="h-3.5 w-3.5" />}
        enabled={o.resize.enabled}
        onToggle={(enabled) => patch('resize', { enabled })}
      >
        <div className="grid grid-cols-4 gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => patch('resize', { mode: m.id })}
              className={cn(
                'h-8 rounded-lg border text-[12px] font-medium transition',
                o.resize.mode === m.id
                  ? 'border-fg bg-fg text-bg shadow-[0_1px_2px_rgb(0_0_0/0.2)]'
                  : 'border-line text-muted hover:text-fg',
              )}
            >
              {m.name}
            </button>
          ))}
        </div>
        {o.resize.mode === 'scale' ? (
          <Slider
            label="缩放比例"
            value={o.resize.scale}
            min={5}
            max={200}
            onChange={(scale) => patch('resize', { scale })}
            format={(v) => `${v}%`}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {o.resize.mode !== 'height' && (
              <Field
                label={o.resize.mode === 'long' ? '长边' : '宽度'}
                className={o.resize.mode === 'long' || o.resize.mode === 'width' ? 'col-span-2' : ''}
              >
                <NumberInput value={o.resize.width} min={1} suffix="px" onChange={(v) => patch('resize', { width: v ?? 1 })} />
              </Field>
            )}
            {['fit', 'cover', 'exact', 'height'].includes(o.resize.mode) && (
              <Field label="高度" className={o.resize.mode === 'height' ? 'col-span-2' : ''}>
                <NumberInput value={o.resize.height} min={1} suffix="px" onChange={(v) => patch('resize', { height: v ?? 1 })} />
              </Field>
            )}
          </div>
        )}
        {o.resize.mode === 'long' && (
          <div className="flex flex-wrap gap-1.5">
            {[1080, 1280, 1600, 1920, 2560].map((v) => (
              <Chip key={v} active={o.resize.width === v} onClick={() => patch('resize', { width: v })}>
                {v}
              </Chip>
            ))}
          </div>
        )}
        {!['cover', 'exact', 'scale'].includes(o.resize.mode) && (
          <label className="flex items-center justify-between text-[13px]">
            <span>不放大小图</span>
            <Switch checked={o.resize.noEnlarge} onChange={(noEnlarge) => patch('resize', { noEnlarge })} />
          </label>
        )}
      </Section>

      <Section title="格式与压缩" icon={<FileType2 className="h-3.5 w-3.5" />}>
        <FormatPicker value={o.output.format} onChange={(format) => patch('output', { format })} />
        {o.output.format !== 'image/png' && (
          <Slider
            label="压缩质量"
            value={o.output.quality}
            min={10}
            max={100}
            onChange={(quality) => patch('output', { quality })}
            format={(v) => `${v} · ${v >= 90 ? '高清' : v >= 75 ? '均衡' : v >= 55 ? '小体积' : '极限压缩'}`}
          />
        )}
        <div className="rounded-xl border border-line/70 p-3">
          <label className="flex items-center justify-between text-[13px]">
            <span>
              限制文件体积
              <span className="ml-1.5 text-[11px] text-muted">自动降质 / 缩图直至达标</span>
            </span>
            <Switch checked={o.output.targetKB !== null} onChange={(v) => patch('output', { targetKB: v ? 500 : null })} />
          </label>
          {o.output.targetKB !== null && (
            <NumberInput
              className="mt-3"
              value={o.output.targetKB}
              min={5}
              suffix="KB"
              onChange={(v) => patch('output', { targetKB: v ?? 100 })}
            />
          )}
        </div>
        {(o.output.format === 'image/jpeg' || o.output.format === 'original') && (
          <Field label="透明区域填充色（转 JPG 时）">
            <ColorSwatches
              size="sm"
              swatches={['#ffffff', '#000000', '#f4f4f5'].map((c) => ({ id: c, css: c }))}
              value={o.output.background}
              onChange={(background) => patch('output', { background })}
              custom={{
                value: o.output.background,
                active: !['#ffffff', '#000000', '#f4f4f5'].includes(o.output.background),
                onChange: (background) => patch('output', { background }),
              }}
            />
          </Field>
        )}
      </Section>

      <Section
        title="水印"
        icon={<Stamp className="h-3.5 w-3.5" />}
        enabled={o.watermark.enabled}
        onToggle={(enabled) => patch('watermark', { enabled })}
      >
        <WatermarkPanel />
      </Section>

      <Section title="文件命名" icon={<PenLine className="h-3.5 w-3.5" />} defaultOpen={false}>
        <Input value={o.rename.template} onChange={(e) => patch('rename', { template: e.target.value })} placeholder="{name}" />
        <div className="flex flex-wrap gap-1.5">
          {renameTokens.map((t) => (
            <Chip key={t.token} onClick={() => patch('rename', { template: o.rename.template + t.token })}>
              {t.label}
            </Chip>
          ))}
        </div>
        <div className="truncate rounded-lg bg-subtle px-3 py-2 text-[12px] text-muted">
          示例：
          <span className="font-medium text-fg">
            {renderFileName(o.rename.template, { name: 'IMG_2041', index: 0, width: 1920, height: 1280 }, 'jpg')}
          </span>
        </div>
      </Section>
    </Inspector>
  )
}

function FormatPicker({ value, onChange }: { value: OutputFormat; onChange: (v: OutputFormat) => void }) {
  const [avif, setAvif] = useState(true)
  useEffect(() => {
    supportsEncode('image/avif').then(setAvif)
  }, [])
  return (
    <Segmented<OutputFormat>
      size="sm"
      value={value}
      onChange={onChange}
      options={[
        { value: 'original', label: '原格式' },
        { value: 'image/jpeg', label: 'JPG' },
        { value: 'image/png', label: 'PNG' },
        { value: 'image/webp', label: 'WebP' },
        { value: 'image/avif', label: 'AVIF', disabled: !avif },
      ]}
    />
  )
}

function WatermarkPanel() {
  const { options, patch } = useBatch()
  const w = options.watermark
  const set = (p: Partial<typeof w>) => patch('watermark', p)
  const logoInput = useRef<HTMLInputElement>(null)

  return (
    <>
      <Segmented
        size="sm"
        value={w.kind}
        onChange={(kind) => set({ kind })}
        options={[
          { value: 'text', label: '文字水印' },
          { value: 'image', label: '图片 / Logo' },
        ]}
      />

      {w.kind === 'text' ? (
        <>
          <textarea
            className="input h-auto min-h-[64px] resize-none py-2"
            value={w.text}
            onChange={(e) => set({ text: e.target.value })}
            placeholder="输入水印文字，支持换行"
          />
          <ColorSwatches
            size="sm"
            swatches={WM_COLORS.map((c) => ({ id: c, css: c }))}
            value={w.color}
            onChange={(color) => set({ color })}
            custom={{ value: w.color, active: !WM_COLORS.includes(w.color), onChange: (color) => set({ color }) }}
          />
          <Slider
            label="字号"
            value={w.fontSize}
            min={1}
            max={20}
            step={0.5}
            onChange={(fontSize) => set({ fontSize })}
            format={(v) => `${v}%`}
          />
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => logoInput.current?.click()}
            className="flex h-14 w-full items-center gap-3 rounded-xl border border-dashed border-line px-3 text-left text-[12px] text-muted transition hover:border-fg/30 hover:text-fg"
          >
            <ImageUp className="h-5 w-5 shrink-0" />
            <span className="truncate">{w.imageName ?? '选择 Logo 图片（推荐透明 PNG）'}</span>
          </button>
          <input
            ref={logoInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) set({ image: f, imageName: f.name })
              e.target.value = ''
            }}
          />
          <Slider
            label="Logo 宽度"
            value={w.imageScale}
            min={3}
            max={60}
            onChange={(imageScale) => set({ imageScale })}
            format={(v) => `${v}%`}
          />
        </>
      )}

      <Slider label="不透明度" value={w.opacity} min={5} max={100} onChange={(opacity) => set({ opacity })} format={(v) => `${v}%`} />

      <div className="flex items-start gap-4">
        <Field label="位置">
          <AnchorPicker value={w.anchor} disabled={w.tile} onChange={(anchor) => set({ anchor })} />
        </Field>
        <div className="flex-1 space-y-3 pt-6">
          <label className="flex items-center justify-between text-[13px]">
            平铺防盗
            <Switch checked={w.tile} onChange={(tile) => set({ tile })} />
          </label>
          <label className="flex items-center justify-between text-[13px]">
            文字阴影
            <Switch checked={w.shadow} onChange={(shadow) => set({ shadow })} />
          </label>
        </div>
      </div>

      {w.tile ? (
        <>
          <Slider
            label="旋转角度"
            value={w.rotation}
            min={-90}
            max={90}
            onChange={(rotation) => set({ rotation })}
            format={(v) => `${v}°`}
          />
          <Slider label="平铺间距" value={w.gap} min={2} max={40} onChange={(gap) => set({ gap })} format={(v) => `${v}%`} />
        </>
      ) : (
        <Slider label="边距" value={w.margin} min={0} max={15} step={0.5} onChange={(margin) => set({ margin })} format={(v) => `${v}%`} />
      )}
    </>
  )
}

const ANCHORS: Anchor[] = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br']

function AnchorPicker({ value, onChange, disabled }: { value: Anchor; onChange: (a: Anchor) => void; disabled?: boolean }) {
  return (
    <div className={cn('grid w-[84px] grid-cols-3 gap-1 rounded-xl bg-subtle p-1.5', disabled && 'pointer-events-none opacity-40')}>
      {ANCHORS.map((a) => (
        <button key={a} type="button" onClick={() => onChange(a)} className="group grid h-6 place-items-center rounded-md hover:bg-panel">
          <span
            className={cn(
              'rounded-full transition-all',
              a === value ? 'h-2.5 w-2.5 bg-fg shadow-[0_0_0_3px_rgb(var(--fg)/0.12)]' : 'h-1.5 w-1.5 bg-muted/50 group-hover:bg-muted',
            )}
          />
        </button>
      ))}
    </div>
  )
}
