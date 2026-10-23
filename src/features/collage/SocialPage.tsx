import { useMemo } from 'react'
import { Palette, Ratio, Shapes, Trash2, Type } from 'lucide-react'
import { ImageStrip } from '@/components/common/ImageStrip'
import { ScenePreview } from '@/components/common/ScenePreview'
import { SceneThumb } from '@/components/common/SceneThumb'
import { Inspector, ToolLayout } from '@/components/layout/ToolLayout'
import { Button } from '@/components/ui/Button'
import { Field, Input, Section } from '@/components/ui/controls'
import { Segmented } from '@/components/ui/Segmented'
import { socialPresets, socialStyles, socialThemes } from '@/core/collage/social'
import type { FontKind } from '@/core/fonts'
import { paintToCss } from '@/core/scene/paint'
import { exportScene } from '@/core/scene/render'
import { useDebounced } from '@/hooks/useDebounced'
import { fmt, label, plural, useMessages, useRouteLocale } from '@/i18n'
import { isChinese } from '@/i18n/locales'
import { cn } from '@/lib/cn'
import { saveBlob, timestamp } from '@/lib/download'
import { useSocial } from '@/stores/collage'
import { ExportFooter, extOf } from './shared'

const intlFirst = [...socialPresets].sort((a, b) => Number(a.region === 'cn') - Number(b.region === 'cn'))

export default function SocialPage() {
  const { images, add, remove, move, clear, options: o, patch, setContent } = useSocial()
  const preset = socialPresets.find((p) => p.id === o.presetId) ?? socialPresets[0]
  const style = socialStyles.find((s) => s.id === o.styleId) ?? socialStyles[0]
  const theme = socialThemes.find((t) => t.id === o.themeId) ?? socialThemes[0]
  const bitmaps = useMemo(() => images.map((i) => i.bitmap), [images])

  const ctx = useMemo(
    () => ({ images: bitmaps, W: preset.width, H: preset.height, content: o.content, theme, font: o.font }),
    [bitmaps, preset, o.content, theme, o.font],
  )
  const scene = useMemo(() => style.build(ctx), [style, ctx])
  // 版式缩略图跟随内容变化，但做防抖避免输入时卡顿
  const thumbCtx = useDebounced(ctx, 400)
  const thumbs = useMemo(() => socialStyles.map((s) => ({ style: s, scene: s.build(thumbCtx) })), [thumbCtx])

  const needImages = style.images[0] > images.length
  const m = useMessages()
  const t = m.social
  // 中文界面国内平台在前，其它语言海外平台在前
  const ordered = isChinese(useRouteLocale()) ? socialPresets : intlFirst
  const styleName = t.styles[style.id as keyof typeof t.styles]?.name ?? style.id

  return (
    <ToolLayout
      toolId="social"
      actions={
        images.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear}>
            <Trash2 className="h-4 w-4" /> {m.common.clearImages}
          </Button>
        )
      }
      left={<ImageStrip images={images} onAdd={add} onRemove={remove} onMove={move} max={4} />}
      inspector={
        <Inspector
          footer={
            <ExportFooter
              disabled={needImages}
              note={needImages ? plural(t.needImages, style.images[0], { style: styleName }) : `${preset.width} × ${preset.height} px`}
              onExport={async (type) =>
                saveBlob(await exportScene(scene, type, 0.94), `${label(t.presets, preset.id)}-${styleName}-${timestamp()}.${extOf(type)}`)
              }
            />
          }
        >
          <Section title={t.canvasTitle} icon={<Ratio className="h-3.5 w-3.5" />}>
            <div className="grid grid-cols-5 gap-1.5">
              {ordered.map((p) => {
                const active = p.id === preset.id
                const r = p.width / p.height
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => patch({ presetId: p.id })}
                    className="group flex flex-col items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        'grid h-12 w-full place-items-center rounded-lg border transition',
                        active ? 'border-fg bg-fg/[0.03] ring-1 ring-fg' : 'border-line group-hover:border-fg/20',
                      )}
                    >
                      <span
                        className={cn('rounded-[3px] border-[1.5px]', active ? 'border-fg bg-fg/10' : 'border-muted/50')}
                        style={{ width: r >= 1 ? 30 : 30 * r, height: r >= 1 ? 30 / r : 30 }}
                      />
                    </span>
                    <span className={cn('text-center text-[10px] font-medium leading-tight', active ? 'text-fg' : 'text-muted')}>
                      {label(t.presets, p.id)}
                      <br />
                      <span className="opacity-70">{p.hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </Section>

          <Section title={t.styleTitle} icon={<Shapes className="h-3.5 w-3.5" />}>
            <div className="grid grid-cols-3 gap-2.5">
              {thumbs.map(({ style: s, scene: sc }) => {
                const active = s.id === style.id
                const text = t.styles[s.id as keyof typeof t.styles]
                return (
                  <button key={s.id} type="button" onClick={() => patch({ styleId: s.id })} className="group text-left">
                    <span
                      className={cn(
                        'block overflow-hidden rounded-lg border transition-all',
                        active ? 'border-fg ring-1 ring-fg' : 'border-line group-hover:border-fg/20',
                      )}
                    >
                      <SceneThumb scene={sc} width={88} className="mx-auto" />
                    </span>
                    <span className={cn('mt-1.5 block text-[12px] font-medium', active ? 'font-semibold text-fg' : 'text-fg')}>
                      {text?.name ?? s.id}
                    </span>
                    <span className="block text-[10px] text-muted">{text?.desc}</span>
                  </button>
                )
              })}
            </div>
          </Section>

          <Section title={t.contentTitle} icon={<Type className="h-3.5 w-3.5" />}>
            <Field label={t.title}>
              <textarea
                className="input h-auto min-h-[60px] resize-none py-2"
                value={o.content.title}
                onChange={(e) => setContent({ title: e.target.value })}
              />
            </Field>
            <Field label={t.subtitle}>
              <textarea
                className="input h-auto min-h-[52px] resize-none py-2"
                value={o.content.subtitle}
                onChange={(e) => setContent({ subtitle: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t.tag}>
                <Input value={o.content.tag} onChange={(e) => setContent({ tag: e.target.value })} />
              </Field>
              <Field label={t.footer}>
                <Input value={o.content.footer} onChange={(e) => setContent({ footer: e.target.value })} />
              </Field>
            </div>
            <Field label={t.font}>
              <Segmented<FontKind>
                size="sm"
                value={o.font}
                onChange={(font) => patch({ font })}
                options={[
                  { value: 'sans', label: t.fontSans },
                  { value: 'serif', label: t.fontSerif },
                ]}
              />
            </Field>
          </Section>

          <Section title={t.themeTitle} icon={<Palette className="h-3.5 w-3.5" />}>
            <div className="grid grid-cols-3 gap-2">
              {socialThemes.map((th) => {
                const active = th.id === theme.id
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => patch({ themeId: th.id })}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-1.5 pr-2 transition',
                      active ? 'border-fg ring-1 ring-fg' : 'border-line hover:border-fg/20',
                    )}
                  >
                    <span className="relative h-7 w-7 shrink-0 rounded-md ring-1 ring-black/5" style={{ background: paintToCss(th.bg) }}>
                      <span
                        className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full ring-2 ring-white/80"
                        style={{ background: th.accent }}
                      />
                    </span>
                    <span className="text-[12px] font-medium">{label(t.themes, th.id)}</span>
                  </button>
                )
              })}
            </div>
          </Section>
        </Inspector>
      }
    >
      <ScenePreview scene={scene} padding={48} />
      {needImages && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <span className="rounded-full bg-black/60 px-3 py-1.5 text-[12px] text-white backdrop-blur">
            {fmt(t.addHint, { style: t.styles.quote.name })}
          </span>
        </div>
      )}
    </ToolLayout>
  )
}
