import type { ComponentType } from 'react'
import {
  Circle,
  Grid2x2,
  Highlighter,
  type LucideProps,
  Minus,
  MousePointer2,
  MoveUpRight,
  Palette,
  Pencil,
  Shapes,
  Square,
  Type,
} from 'lucide-react'
import { Inspector } from '@/components/layout/ToolLayout'
import { ColorSwatches } from '@/components/ui/ColorSwatches'
import { Field, Section, Slider, Switch } from '@/components/ui/controls'
import { useMessages } from '@/i18n'
import { cn } from '@/lib/cn'
import { type AnnotateTool, useAnnotate } from '@/stores/annotate'
import { ExportFooter } from '../collage/shared'

/** 标注颜色（图片内容色，不随主题变化） */
export const ANNOTATE_COLORS = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE', '#111114', '#FFFFFF']

/** 序号工具图标：带数字的圆点 */
const StepIcon = ({ className }: LucideProps) => (
  <span className={cn('grid place-items-center rounded-full border-[1.6px] border-current text-[9px] font-bold leading-none', className)}>
    1
  </span>
)

/** 工具、图标与快捷键 */
export const TOOLS: { id: AnnotateTool; icon: ComponentType<LucideProps>; key: string }[] = [
  { id: 'select', icon: MousePointer2, key: 'V' },
  { id: 'arrow', icon: MoveUpRight, key: 'A' },
  { id: 'rect', icon: Square, key: 'R' },
  { id: 'ellipse', icon: Circle, key: 'O' },
  { id: 'line', icon: Minus, key: 'L' },
  { id: 'pen', icon: Pencil, key: 'P' },
  { id: 'marker', icon: Highlighter, key: 'H' },
  { id: 'text', icon: Type, key: 'T' },
  { id: 'mosaic', icon: Grid2x2, key: 'M' },
  { id: 'step', icon: StepIcon, key: 'N' },
]

export function AnnotateInspector() {
  const { source, tool, setTool, color, size, fill, setStyle, shapes, selectedId, exportImage } = useAnnotate()
  const m = useMessages()
  const t = m.annotate
  const selected = shapes.find((s) => s.id === selectedId)
  // 选中图形时，样式面板展示并修改该图形
  const kind = selected?.kind ?? tool
  const cur = selected ?? { color, size }
  const curFill = selected ? 'fill' in selected && !!selected.fill : fill
  const active = ANNOTATE_COLORS.find((c) => c.toLowerCase() === cur.color.toLowerCase())
  const hasFill = kind === 'rect' || kind === 'ellipse' || kind === 'text'

  return (
    <Inspector
      footer={
        <ExportFooter disabled={!source} note={source ? `${source.width} × ${source.height} px` : undefined} onExport={exportImage} />
      }
    >
      <Section title={t.toolTitle} icon={<Shapes className="h-3.5 w-3.5" />}>
        <div className="grid grid-cols-5 gap-1.5">
          {TOOLS.map(({ id, icon: Icon, key }) => (
            <button
              key={id}
              type="button"
              title={`${t.tools[id]} (${key})`}
              onClick={() => setTool(id)}
              className={cn(
                'flex h-14 flex-col items-center justify-center gap-1 rounded-xl border text-[11px] transition-all',
                tool === id
                  ? 'border-fg bg-fg text-bg shadow-[0_1px_2px_rgb(0_0_0/0.2)]'
                  : 'border-line bg-panel text-muted hover:border-fg/20 hover:text-fg',
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="max-w-full truncate px-1">{t.tools[id]}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title={t.styleTitle} icon={<Palette className="h-3.5 w-3.5" />}>
        {kind !== 'select' && kind !== 'mosaic' && (
          <Field label={t.color}>
            <ColorSwatches
              size="sm"
              swatches={ANNOTATE_COLORS.map((c) => ({ id: c, css: c }))}
              value={active ?? null}
              onChange={(c) => setStyle({ color: c })}
              custom={{ value: cur.color, active: !active, onChange: (c) => setStyle({ color: c }) }}
            />
          </Field>
        )}
        {kind !== 'select' && (
          <Slider
            label={kind === 'text' ? t.fontSize : kind === 'mosaic' ? t.blockSize : kind === 'step' ? t.badgeSize : t.size}
            value={cur.size}
            min={1}
            max={10}
            onChange={(v) => setStyle({ size: v })}
          />
        )}
        {hasFill && (
          <label className="flex items-center justify-between text-[13px]">
            {kind === 'text' ? t.textBg : t.fill}
            <Switch checked={curFill} onChange={(v) => setStyle({ fill: v })} />
          </label>
        )}
        {kind === 'select' && <p className="text-[12px] leading-relaxed text-muted">{t.selectHint}</p>}
        <p className="rounded-lg border border-line bg-subtle/60 px-3 py-2 text-[12px] leading-relaxed text-muted">{t.hint}</p>
      </Section>
    </Inspector>
  )
}
