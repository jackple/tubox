import { useEffect, useMemo } from 'react'
import { LayoutTemplate, Paintbrush, Trash2 } from 'lucide-react'
import { ImageStrip } from '@/components/common/ImageStrip'
import { ScenePreview } from '@/components/common/ScenePreview'
import { Inspector, ToolLayout } from '@/components/layout/ToolLayout'
import { Button } from '@/components/ui/Button'
import { Chip, Field, Section, Slider } from '@/components/ui/controls'
import { buildGrid, gridSize } from '@/core/collage/grid'
import { type GridTemplate, gridTemplates } from '@/core/collage/templates'
import { exportScene } from '@/core/scene/render'
import { plural, useMessages } from '@/i18n'
import { cn } from '@/lib/cn'
import { saveBlob, timestamp } from '@/lib/download'
import { useGrid } from '@/stores/collage'
import { BackgroundField, EmptyStage, ExportFooter, extOf } from './shared'

const RATIOS: { label: string; v: [number, number] }[] = [
  { label: '1:1', v: [1, 1] },
  { label: '3:4', v: [3, 4] },
  { label: '4:5', v: [4, 5] },
  { label: '4:3', v: [4, 3] },
  { label: '9:16', v: [9, 16] },
  { label: '16:9', v: [16, 9] },
  { label: '2:3', v: [2, 3] },
]

export default function GridPage() {
  const { images, add, remove, move, clear, options: o, patch } = useGrid()
  const template = gridTemplates.find((t) => t.id === o.templateId) ?? gridTemplates[0]

  // 图片数量变化时，自动切到匹配数量的模板
  useEffect(() => {
    const n = images.length
    if (n >= 2 && template.count !== n) {
      const match = gridTemplates.find((t) => t.count === n)
      if (match) patch({ templateId: match.id })
    }
  }, [images.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const bitmaps = useMemo(() => images.map((i) => i.bitmap), [images])
  const scene = useMemo(() => buildGrid(bitmaps, template, o), [bitmaps, template, o])
  const [W, H] = gridSize(o.ratio)
  const m = useMessages()

  return (
    <ToolLayout
      toolId="grid"
      actions={
        images.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear}>
            <Trash2 className="h-4 w-4" /> {m.common.clear}
          </Button>
        )
      }
      left={images.length > 0 && <ImageStrip images={images} onAdd={add} onRemove={remove} onMove={move} max={9} />}
      inspector={
        <Inspector
          footer={
            <ExportFooter
              disabled={!images.length}
              note={`${W} × ${H} px`}
              onExport={async (type) =>
                saveBlob(
                  await exportScene(buildGrid(bitmaps, template, o, false), type, 0.92),
                  `${m.grid.fileName}-${timestamp()}.${extOf(type)}`,
                )
              }
            />
          }
        >
          <Section title={m.grid.templateTitle} icon={<LayoutTemplate className="h-3.5 w-3.5" />}>
            <div className="grid grid-cols-4 gap-2">
              {gridTemplates.map((t) => (
                <TemplateThumb
                  key={t.id}
                  t={t}
                  active={t.id === template.id}
                  dim={images.length > 0 && t.count !== images.length}
                  onClick={() => patch({ templateId: t.id })}
                />
              ))}
            </div>
            <Field label={m.grid.ratio}>
              <div className="flex flex-wrap gap-1.5">
                {RATIOS.map((r) => (
                  <Chip key={r.label} active={o.ratio[0] === r.v[0] && o.ratio[1] === r.v[1]} onClick={() => patch({ ratio: r.v })}>
                    {r.label}
                  </Chip>
                ))}
              </div>
            </Field>
          </Section>
          <Section title={m.common.style} icon={<Paintbrush className="h-3.5 w-3.5" />}>
            <Slider label={m.common.gap} value={o.gap} min={0} max={100} onChange={(gap) => patch({ gap })} format={(v) => `${v}px`} />
            <Slider
              label={m.common.padding}
              value={o.padding}
              min={0}
              max={160}
              onChange={(padding) => patch({ padding })}
              format={(v) => `${v}px`}
            />
            <Slider
              label={m.common.radius}
              value={o.radius}
              min={0}
              max={120}
              onChange={(radius) => patch({ radius })}
              format={(v) => `${v}px`}
            />
            <BackgroundField value={o.background} onChange={(background) => patch({ background })} />
          </Section>
        </Inspector>
      }
    >
      {images.length ? <ScenePreview scene={scene} /> : <EmptyStage onFiles={add} title={m.grid.emptyTitle} hint={m.grid.emptyHint} />}
    </ToolLayout>
  )
}

function TemplateThumb({ t, active, dim, onClick }: { t: GridTemplate; active: boolean; dim: boolean; onClick: () => void }) {
  const m = useMessages()
  return (
    <button
      type="button"
      onClick={onClick}
      title={plural(m.grid.count, t.count)}
      className={cn(
        'relative aspect-square rounded-lg border p-1.5 transition-all',
        active ? 'border-fg bg-fg/[0.03] ring-1 ring-fg' : 'border-line hover:border-fg/20',
        dim && !active && 'opacity-40',
      )}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {t.cells.map((c, i) => (
          <rect
            key={i}
            x={c.x * 100 + 2}
            y={c.y * 100 + 2}
            width={c.w * 100 - 4}
            height={c.h * 100 - 4}
            rx={5}
            className={active ? 'fill-fg' : 'fill-muted/30'}
          />
        ))}
      </svg>
      <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-muted">{t.count}</span>
    </button>
  )
}
