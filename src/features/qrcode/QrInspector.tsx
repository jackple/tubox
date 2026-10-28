import { type ReactNode, useRef, useState } from 'react'
import { Download, ImageUp, Palette, RefreshCw, Shapes, SlidersHorizontal, Sparkles, Trash2, Type } from 'lucide-react'
import { toast } from 'sonner'
import { Inspector } from '@/components/layout/ToolLayout'
import { Button } from '@/components/ui/Button'
import { ColorSwatches } from '@/components/ui/ColorSwatches'
import { Field, Input, Section, Slider, Switch } from '@/components/ui/controls'
import { Segmented } from '@/components/ui/Segmented'
import type { QrContentType, WifiEncryption } from '@/core/qrcode/content'
import {
  type DotStyle,
  type EyeStyle,
  type QrArtStyle,
  type QrEcc,
  type QrShape,
  QR_ART_PALETTES,
  encodeQr,
  layoutQr,
} from '@/core/qrcode/render'
import { errorMessage, useMessages } from '@/i18n'
import { cn } from '@/lib/cn'
import { type QrFormat, useQrCode } from '@/stores/qrcode'

/** 码点 / 背景预设色（图片内容色，不随主题变化） */
const FG_COLORS = ['#111114', '#1E3A8A', '#0F766E', '#6D4AFF', '#BE123C', '#C2410C']
// 背景不放深色：码点默认是深色，深色背景会看不见；反色码很多扫码器也不支持
const BG_COLORS = ['#FFFFFF', '#F5F0E8', '#EEF0F5', '#FEF3C7', '#E0F2FE', '#FCE7F3']
/** 各容错等级可恢复的码字比例 */
const ECC_RECOVERY: Record<QrEcc, string> = { L: '7%', M: '15%', Q: '25%', H: '30%' }

const DOT_STYLES: DotStyle[] = ['square', 'rounded', 'dots', 'vline', 'hline']
const EYE_STYLES: EyeStyle[] = ['square', 'rounded', 'leaf', 'circle']
const ART_STYLES: QrArtStyle[] = ['none', 'mist', 'bloom', 'ripple', 'noir']

/** 样式预览：用真实排版函数渲染一个示例码（版本 2，25×25），码点取中间一块，定位点取左上角 */
const SAMPLE = encodeQr('https://tubox.top', 'L')
const sampleLayout = (dots: DotStyle, eyes: EyeStyle) => layoutQr(SAMPLE, { dots, eyes, shape: 'square', margin: 0, logo: null })
const DOT_PREVIEW = Object.fromEntries(DOT_STYLES.map((k) => [k, sampleLayout(k, 'square').dots])) as Record<DotStyle, string>
const EYE_PREVIEW = Object.fromEntries(
  EYE_STYLES.map((k) => {
    const l = sampleLayout('square', k)
    return [k, [l.eyeOuter, l.eyeInner]]
  }),
) as Record<EyeStyle, [string, string]>

function ArtPreview({ style }: { style: QrArtStyle }) {
  const palette = style === 'none' ? null : QR_ART_PALETTES[style]
  return (
    <span
      className="relative block h-8 w-8 overflow-hidden rounded-md shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)]"
      style={{
        background: palette
          ? `radial-gradient(circle at 72% 22%, ${palette.accents[1]}cc 0 18%, transparent 19%), linear-gradient(135deg, ${palette.from}, ${palette.to})`
          : 'repeating-linear-gradient(45deg, rgb(var(--fg)/0.08) 0 2px, transparent 2px 5px)',
      }}
    >
      <svg viewBox="7 7 12 12" className="absolute inset-0 h-full w-full p-0.5 text-fg" aria-hidden>
        <path d={DOT_PREVIEW.rounded} fill="currentColor" />
      </svg>
    </span>
  )
}

function StyleTiles<T extends string>({
  value,
  onChange,
  items,
  cols,
}: {
  value: T
  onChange: (v: T) => void
  items: { value: T; label: string; preview: ReactNode }[]
  cols: number
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          title={it.label}
          onClick={() => onChange(it.value)}
          className={cn(
            'flex flex-col items-center gap-1 rounded-lg border px-1 pb-1 pt-2 transition-colors',
            it.value === value ? 'border-fg bg-fg/[0.04] shadow-[0_0_0_1px_rgb(var(--fg))]' : 'border-line hover:border-fg/30',
          )}
        >
          {it.preview}
          <span className={cn('w-full truncate text-center text-[11px]', it.value === value ? 'text-fg' : 'text-muted')}>{it.label}</span>
        </button>
      ))}
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
  presets,
}: {
  label?: string
  value: string
  onChange: (c: string) => void
  presets: string[]
}) {
  const active = presets.find((c) => c.toLowerCase() === value.toLowerCase())
  const swatches = (
    <ColorSwatches
      size="sm"
      swatches={presets.map((c) => ({ id: c, css: c }))}
      value={active ?? null}
      onChange={onChange}
      custom={{ value, active: !active, onChange }}
    />
  )
  return label ? <Field label={label}>{swatches}</Field> : swatches
}

function SwitchRow({
  label,
  checked,
  onChange,
  children,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  children?: ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center justify-between text-[13px]">
        <span>{label}</span>
        <Switch checked={checked} onChange={onChange} />
      </label>
      {checked && children}
    </div>
  )
}

export function QrInspector() {
  const s = useQrCode()
  const [busy, setBusy] = useState(false)
  const logoInput = useRef<HTMLInputElement>(null)
  const artworkInput = useRef<HTMLInputElement>(null)
  const m = useMessages()
  const t = m.qrcode

  return (
    <Inspector
      footer={
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <Segmented<QrFormat>
              size="sm"
              className="w-[156px]"
              value={s.format}
              onChange={(format) => s.update({ format })}
              options={[
                { value: 'image/png', label: 'PNG' },
                { value: 'image/jpeg', label: 'JPG', disabled: s.transparent },
                { value: 'image/svg+xml', label: 'SVG' },
              ]}
            />
            <Button
              variant="primary"
              className="flex-1"
              loading={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await s.exportImage()
                } catch (e) {
                  toast.error(m.common.exportFailed, { description: errorMessage(e) })
                } finally {
                  setBusy(false)
                }
              }}
            >
              {!busy && <Download className="h-4 w-4" />} {t.download}
            </Button>
          </div>
          {s.transparent && <p className="text-center text-[11px] text-muted">{t.jpgNoAlpha}</p>}
        </div>
      }
    >
      <Section title={t.contentTitle} icon={<Type className="h-3.5 w-3.5" />}>
        <Segmented<QrContentType>
          size="sm"
          value={s.type}
          onChange={(type) => s.update({ type })}
          options={(['url', 'text', 'wifi', 'contact'] as const).map((k) => ({ value: k, label: t.types[k] }))}
        />
        {s.type === 'url' && (
          <Input
            type="url"
            inputMode="url"
            value={s.url}
            placeholder={t.urlPlaceholder}
            onChange={(e) => s.update({ url: e.target.value })}
          />
        )}
        {s.type === 'text' && (
          <textarea
            className="input h-auto min-h-[112px] resize-y py-2"
            value={s.text}
            onChange={(e) => s.update({ text: e.target.value })}
            placeholder={t.textPlaceholder}
          />
        )}
        {s.type === 'wifi' && (
          <>
            <Field label={t.wifi.ssid}>
              <Input value={s.wifi.ssid} onChange={(e) => s.update({ wifi: { ...s.wifi, ssid: e.target.value } })} />
            </Field>
            <Field label={t.wifi.encryption}>
              <Segmented<WifiEncryption>
                size="sm"
                value={s.wifi.encryption}
                onChange={(encryption) => s.update({ wifi: { ...s.wifi, encryption } })}
                options={[
                  { value: 'WPA', label: 'WPA / WPA2' },
                  { value: 'WEP', label: 'WEP' },
                  { value: 'nopass', label: t.wifi.none },
                ]}
              />
            </Field>
            {s.wifi.encryption !== 'nopass' && (
              <Field label={t.wifi.password}>
                <Input value={s.wifi.password} onChange={(e) => s.update({ wifi: { ...s.wifi, password: e.target.value } })} />
              </Field>
            )}
            <SwitchRow label={t.wifi.hidden} checked={s.wifi.hidden} onChange={(hidden) => s.update({ wifi: { ...s.wifi, hidden } })} />
          </>
        )}
        {s.type === 'contact' && (
          <div className="grid grid-cols-2 gap-3">
            {(['name', 'phone', 'email', 'org', 'title', 'url'] as const).map((k) => (
              <Field key={k} label={t.contact[k]} className={k === 'email' || k === 'url' ? 'col-span-2' : undefined}>
                <Input
                  type={k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'}
                  value={s.contact[k]}
                  onChange={(e) => s.update({ contact: { ...s.contact, [k]: e.target.value } })}
                />
              </Field>
            ))}
          </div>
        )}
      </Section>

      <Section title={t.styleTitle} icon={<Shapes className="h-3.5 w-3.5" />}>
        <Field label={t.dots}>
          <StyleTiles<DotStyle>
            cols={5}
            value={s.dots}
            onChange={(dots) => s.update({ dots })}
            items={DOT_STYLES.map((k) => ({
              value: k,
              label: t.dotStyles[k],
              preview: (
                <svg viewBox="7 7 10 10" className="h-8 w-8 text-fg" aria-hidden>
                  <path d={DOT_PREVIEW[k]} fill="currentColor" />
                </svg>
              ),
            }))}
          />
        </Field>
        <Field label={t.eyes}>
          <StyleTiles<EyeStyle>
            cols={4}
            value={s.eyes}
            onChange={(eyes) => s.update({ eyes })}
            items={EYE_STYLES.map((k) => ({
              value: k,
              label: t.eyeStyles[k],
              preview: (
                <svg viewBox="-1 -1 9 9" className="h-8 w-8 text-fg" aria-hidden>
                  <path d={EYE_PREVIEW[k][0]} fill="currentColor" fillRule="evenodd" />
                  <path d={EYE_PREVIEW[k][1]} fill="currentColor" />
                </svg>
              ),
            }))}
          />
        </Field>
        <Field label={t.shape}>
          <Segmented<QrShape>
            size="sm"
            value={s.shape}
            onChange={(shape) => s.update({ shape })}
            options={(['square', 'circle'] as const).map((k) => ({ value: k, label: t.shapes[k] }))}
          />
        </Field>
      </Section>

      <Section title={t.artTitle} icon={<Sparkles className="h-3.5 w-3.5" />}>
        <p className="-mt-1 text-[11px] leading-relaxed text-muted">{t.artHint}</p>
        <StyleTiles<QrArtStyle>
          cols={3}
          value={s.artStyle}
          onChange={(artStyle) => s.update({ artStyle })}
          items={ART_STYLES.map((style) => ({
            value: style,
            label: t.artStyles[style],
            preview: <ArtPreview style={style} />,
          }))}
        />
        {s.artStyle !== 'none' && (
          <>
            <Field label={t.artPrompt}>
              <div className="flex items-center gap-2">
                <Input
                  value={s.artPrompt}
                  onChange={(e) => s.update({ artPrompt: e.target.value })}
                  placeholder={t.artPromptPlaceholder}
                  className="h-8 min-w-0 text-[12px]"
                />
                <Button size="icon" variant="soft" title={t.artReroll} aria-label={t.artReroll} onClick={s.shuffleArt}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Field>
            {s.artwork && (
              <div className="flex items-center gap-2 rounded-xl border border-line p-2">
                <img src={s.artwork.href} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                <span className="min-w-0 flex-1 truncate text-[12px]">{t.artImage}</span>
                <Button size="sm" variant="danger" onClick={s.removeArtwork}>
                  <Trash2 className="h-3.5 w-3.5" /> {t.removeArtImage}
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="flex-1" onClick={() => artworkInput.current?.click()}>
                <ImageUp className="h-3.5 w-3.5" /> {s.artwork ? t.changeArtImage : t.chooseArtImage}
              </Button>
              <Button size="sm" variant="soft" onClick={s.shuffleArt}>
                <RefreshCw className="h-3.5 w-3.5" /> {t.artReroll}
              </Button>
            </div>
            <Slider
              label={t.artIntensity}
              value={Math.round(s.artIntensity * 100)}
              min={20}
              max={100}
              onChange={(v) => s.update({ artIntensity: v / 100 })}
              format={(v) => `${v}%`}
            />
          </>
        )}
        <input
          ref={artworkInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) s.setArtwork(f).catch((err) => toast.error(errorMessage(err)))
            e.target.value = ''
          }}
        />
      </Section>

      <Section title={t.colorTitle} icon={<Palette className="h-3.5 w-3.5" />}>
        <ColorField label={t.fg} value={s.fg} presets={FG_COLORS} onChange={(fg) => s.update({ fg })} />
        <SwitchRow label={t.gradient} checked={s.gradient} onChange={(gradient) => s.update({ gradient })}>
          <ColorField value={s.fg2} presets={FG_COLORS} onChange={(fg2) => s.update({ fg2 })} />
        </SwitchRow>
        <SwitchRow label={t.eyeColor} checked={s.eyeCustom} onChange={(eyeCustom) => s.update({ eyeCustom })}>
          <ColorField value={s.eye} presets={FG_COLORS} onChange={(eye) => s.update({ eye })} />
        </SwitchRow>
        {!s.transparent && <ColorField label={t.bg} value={s.bg} presets={BG_COLORS} onChange={(bg) => s.update({ bg })} />}
        <SwitchRow label={t.transparent} checked={s.transparent} onChange={(transparent) => s.update({ transparent })} />
      </Section>

      <Section title={t.logoTitle} icon={<ImageUp className="h-3.5 w-3.5" />}>
        {s.logo ? (
          <div className="flex items-center gap-3 rounded-xl border border-line p-2">
            <span className="checker grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg">
              <img src={s.logo.href} alt="" className="max-h-full max-w-full object-contain" />
            </span>
            <Button size="sm" variant="ghost" className="flex-1 justify-start" onClick={() => logoInput.current?.click()}>
              {t.chooseLogo}
            </Button>
            <Button size="sm" variant="danger" onClick={s.removeLogo}>
              <Trash2 className="h-3.5 w-3.5" /> {t.removeLogo}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => logoInput.current?.click()}
            className="flex h-14 w-full items-center gap-3 rounded-xl border border-dashed border-line px-3 text-left text-[12px] text-muted transition hover:border-fg/30 hover:text-fg"
          >
            <ImageUp className="h-5 w-5 shrink-0" />
            <span className="truncate">{t.chooseLogo}</span>
          </button>
        )}
        <input
          ref={logoInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) s.setLogo(f).catch((err) => toast.error(errorMessage(err)))
            e.target.value = ''
          }}
        />
        {s.logo && (
          <>
            <Slider
              label={t.logoSize}
              value={Math.round(s.logoRatio * 100)}
              min={12}
              max={30}
              onChange={(v) => s.update({ logoRatio: v / 100 })}
              format={(v) => `${v}%`}
            />
            <SwitchRow label={t.logoPlate} checked={s.logoPlate} onChange={(logoPlate) => s.update({ logoPlate })} />
            <p className="text-[11px] leading-relaxed text-muted">{t.logoHint}</p>
          </>
        )}
      </Section>

      <Section title={t.advancedTitle} icon={<SlidersHorizontal className="h-3.5 w-3.5" />}>
        <Field label={t.ecc}>
          <Segmented<QrEcc>
            size="sm"
            value={s.ecc}
            onChange={(ecc) => s.update({ ecc })}
            options={(['L', 'M', 'Q', 'H'] as const).map((k) => ({ value: k, label: `${k} ${ECC_RECOVERY[k]}` }))}
          />
          <p className="text-[11px] leading-relaxed text-muted">{t.eccHint}</p>
        </Field>
        <Slider label={t.margin} value={s.margin} min={0} max={6} onChange={(margin) => s.update({ margin })} />
        <Slider
          label={t.size}
          value={s.size}
          min={256}
          max={2048}
          step={64}
          onChange={(size) => s.update({ size })}
          format={(v) => `${v}px`}
        />
      </Section>
    </Inspector>
  )
}
