import { useMemo } from 'react'
import { ArrowLeftRight, ArrowUpDown, Clapperboard, Rows3, Trash2 } from 'lucide-react'
import { ImageStrip } from '@/components/common/ImageStrip'
import { ScenePreview } from '@/components/common/ScenePreview'
import { Inspector, ToolLayout } from '@/components/layout/ToolLayout'
import { Button } from '@/components/ui/Button'
import { Chip, Field, NumberInput, Section, Slider } from '@/components/ui/controls'
import { Segmented } from '@/components/ui/Segmented'
import { buildLongImage } from '@/core/collage/longImage'
import { exportScene } from '@/core/scene/render'
import { useMessages } from '@/i18n'
import { saveBlob, timestamp } from '@/lib/download'
import { useLongImage } from '@/stores/collage'
import { BackgroundField, EmptyStage, ExportFooter, extOf } from './shared'

export default function LongImagePage() {
  const { images, add, remove, move, clear, options: o, patch } = useLongImage()
  const vertical = o.direction === 'vertical'
  const m = useMessages()
  const t = m.long

  const built = useMemo(
    () =>
      buildLongImage(
        images.map((i) => i.bitmap),
        o,
      ),
    [images, o],
  )
  const { scene, exportScale } = built

  return (
    <ToolLayout
      toolId="long"
      actions={
        images.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear}>
            <Trash2 className="h-4 w-4" /> {m.common.clear}
          </Button>
        )
      }
      left={images.length > 0 && <ImageStrip images={images} onAdd={add} onRemove={remove} onMove={move} variant="list" max={80} />}
      inspector={
        <Inspector
          footer={
            <ExportFooter
              disabled={!images.length}
              note={`${Math.round(scene.width * exportScale)} × ${Math.round(scene.height * exportScale)} px${exportScale < 1 ? t.scaled : ''}`}
              onExport={async (type) =>
                saveBlob(await exportScene(scene, type, 0.92, exportScale), `${t.fileName}-${timestamp()}.${extOf(type)}`)
              }
            />
          }
        >
          <Section title={t.modeTitle} icon={<Rows3 className="h-3.5 w-3.5" />}>
            <Segmented
              value={o.mode === 'subtitle' ? 'subtitle' : o.direction}
              onChange={(v) =>
                v === 'subtitle' ? patch({ mode: 'subtitle', direction: 'vertical' }) : patch({ mode: 'normal', direction: v })
              }
              options={[
                {
                  value: 'vertical',
                  label: (
                    <>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      {t.vertical}
                    </>
                  ),
                },
                {
                  value: 'horizontal',
                  label: (
                    <>
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                      {t.horizontal}
                    </>
                  ),
                },
                {
                  value: 'subtitle',
                  label: (
                    <>
                      <Clapperboard className="h-3.5 w-3.5" />
                      {t.subtitle}
                    </>
                  ),
                },
              ]}
            />
            {o.mode === 'subtitle' && (
              <>
                <p className="rounded-lg border border-line bg-subtle/60 px-3 py-2 text-[12px] leading-relaxed text-muted">
                  {t.subtitleNote}
                </p>
                <Slider
                  label={t.subtitleHeight}
                  value={o.subtitleRatio}
                  min={6}
                  max={40}
                  onChange={(subtitleRatio) => patch({ subtitleRatio })}
                  format={(v) => `${v}%`}
                />
              </>
            )}
            <Field label={vertical ? t.outWidth : t.outHeight}>
              <NumberInput value={o.size} min={200} max={8000} suffix="px" onChange={(v) => patch({ size: v ?? 1080 })} />
            </Field>
            <div className="flex flex-wrap gap-1.5">
              {[750, 1080, 1242, 1440, 2048].map((v) => (
                <Chip key={v} active={o.size === v} onClick={() => patch({ size: v })}>
                  {v}
                </Chip>
              ))}
            </div>
          </Section>
          <Section title={m.common.style}>
            {o.mode !== 'subtitle' && (
              <Slider label={t.imageGap} value={o.gap} min={0} max={80} onChange={(gap) => patch({ gap })} format={(v) => `${v}px`} />
            )}
            <Slider
              label={m.common.padding}
              value={o.padding}
              min={0}
              max={120}
              onChange={(padding) => patch({ padding })}
              format={(v) => `${v}px`}
            />
            <Slider
              label={m.common.radius}
              value={o.radius}
              min={0}
              max={60}
              onChange={(radius) => patch({ radius })}
              format={(v) => `${v}px`}
            />
            <BackgroundField value={o.background} onChange={(background) => patch({ background })} />
          </Section>
        </Inspector>
      }
    >
      {images.length ? (
        <ScenePreview scene={scene} fit={vertical ? 'width' : 'contain'} />
      ) : (
        <EmptyStage onFiles={add} title={t.emptyTitle} hint={t.emptyHint} />
      )}
    </ToolLayout>
  )
}
