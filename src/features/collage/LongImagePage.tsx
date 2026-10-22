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
import { saveBlob, timestamp } from '@/lib/download'
import { useLongImage } from '@/stores/collage'
import { BackgroundField, EmptyStage, ExportFooter, extOf } from './shared'

export default function LongImagePage() {
  const { images, add, remove, move, clear, options: o, patch } = useLongImage()
  const vertical = o.direction === 'vertical'

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
            <Trash2 className="h-4 w-4" /> 清空
          </Button>
        )
      }
      left={images.length > 0 && <ImageStrip images={images} onAdd={add} onRemove={remove} onMove={move} variant="list" max={80} />}
      inspector={
        <Inspector
          footer={
            <ExportFooter
              disabled={!images.length}
              note={`${Math.round(scene.width * exportScale)} × ${Math.round(scene.height * exportScale)} px${exportScale < 1 ? '（已按浏览器上限缩放）' : ''}`}
              onExport={async (type) => saveBlob(await exportScene(scene, type, 0.92, exportScale), `长图-${timestamp()}.${extOf(type)}`)}
            />
          }
        >
          <Section title="拼接方式" icon={<Rows3 className="h-3.5 w-3.5" />}>
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
                      竖向
                    </>
                  ),
                },
                {
                  value: 'horizontal',
                  label: (
                    <>
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                      横向
                    </>
                  ),
                },
                {
                  value: 'subtitle',
                  label: (
                    <>
                      <Clapperboard className="h-3.5 w-3.5" />
                      字幕
                    </>
                  ),
                },
              ]}
            />
            {o.mode === 'subtitle' && (
              <>
                <p className="rounded-lg border border-line bg-subtle/60 px-3 py-2 text-[12px] leading-relaxed text-muted">
                  首张保留完整画面，其余仅保留底部字幕条，适合拼接电影截图。
                </p>
                <Slider
                  label="字幕条高度"
                  value={o.subtitleRatio}
                  min={6}
                  max={40}
                  onChange={(subtitleRatio) => patch({ subtitleRatio })}
                  format={(v) => `${v}%`}
                />
              </>
            )}
            <Field label={vertical ? '输出宽度' : '输出高度'}>
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
          <Section title="样式">
            {o.mode !== 'subtitle' && (
              <Slider label="图片间距" value={o.gap} min={0} max={80} onChange={(gap) => patch({ gap })} format={(v) => `${v}px`} />
            )}
            <Slider
              label="外边距"
              value={o.padding}
              min={0}
              max={120}
              onChange={(padding) => patch({ padding })}
              format={(v) => `${v}px`}
            />
            <Slider label="圆角" value={o.radius} min={0} max={60} onChange={(radius) => patch({ radius })} format={(v) => `${v}px`} />
            <BackgroundField value={o.background} onChange={(background) => patch({ background })} />
          </Section>
        </Inspector>
      }
    >
      {images.length ? (
        <ScenePreview scene={scene} fit={vertical ? 'width' : 'contain'} />
      ) : (
        <EmptyStage onFiles={add} title="添加多张图片拼成长图" hint="聊天记录截图、电影字幕、教程步骤图都适用" />
      )}
    </ToolLayout>
  )
}
