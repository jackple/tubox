import { useMemo, useState } from 'react'
import { Crop, Download, Palette, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { Inspector } from '@/components/layout/ToolLayout'
import { Button } from '@/components/ui/Button'
import { ColorSwatches } from '@/components/ui/ColorSwatches'
import { Section, Slider } from '@/components/ui/controls'
import { Segmented } from '@/components/ui/Segmented'
import { cutoutRegion } from '@/core/cutout/compose'
import { errorMessage, useMessages } from '@/i18n'
import { type BgMode, type CutoutFormat, useCutout } from '@/stores/cutout'

/** 纯色背景预设（图片内容色，不随主题变化） */
const BG_COLORS = ['#FFFFFF', '#F3F4F6', '#111114', '#438EDB', '#E5322D', '#FDE2E4', '#E2ECE9', '#FFF4D6']

export function CutoutInspector() {
  const s = useCutout()
  const [busy, setBusy] = useState(false)
  const m = useMessages()
  const t = m.cutout

  const size = useOutputSize()
  const active = BG_COLORS.find((c) => c.toLowerCase() === s.bgColor.toLowerCase())

  return (
    <Inspector
      footer={
        <div className="space-y-2.5">
          <div className="flex justify-between text-[11px] text-muted">
            <span>{t.outputSize}</span>
            <span className="font-mono tabular-nums">{size ? `${size[0]}×${size[1]}px` : '—'}</span>
          </div>
          <div className="flex gap-2">
            <Segmented<CutoutFormat>
              size="sm"
              className="w-[156px]"
              value={s.format}
              onChange={s.setFormat}
              options={[
                { value: 'image/png', label: 'PNG' },
                { value: 'image/webp', label: 'WebP' },
                { value: 'image/jpeg', label: 'JPG', disabled: s.bgMode === 'none' },
              ]}
            />
            <Button
              variant="primary"
              className="flex-1"
              disabled={!s.matte}
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
          {s.bgMode === 'none' && <p className="text-center text-[11px] text-muted">{t.jpgNoAlpha}</p>}
        </div>
      }
    >
      <Section title={t.bgTitle} icon={<Palette className="h-3.5 w-3.5" />}>
        <Segmented<BgMode>
          value={s.bgMode}
          onChange={s.setBgMode}
          options={(['none', 'color', 'blur'] as const).map((k) => ({ value: k, label: t.bgModes[k] }))}
        />
        {s.bgMode === 'color' && (
          <ColorSwatches
            swatches={BG_COLORS.map((c) => ({ id: c, css: c }))}
            value={active ?? null}
            onChange={s.setBgColor}
            custom={{ value: s.bgColor, active: !active, onChange: s.setBgColor }}
          />
        )}
        {s.bgMode === 'blur' && <Slider label={t.blurAmount} value={s.blur} min={1} max={100} onChange={s.setBlur} />}
      </Section>

      <Section title={t.edgeTitle} icon={<Sparkles className="h-3.5 w-3.5" />}>
        <Slider
          label={t.shift}
          value={s.edge.shift}
          min={-10}
          max={10}
          onChange={(shift) => s.setEdge({ shift })}
          format={(v) => (v > 0 ? `+${v}` : v)}
        />
        <Slider label={t.feather} value={s.edge.feather} min={0} max={10} onChange={(feather) => s.setEdge({ feather })} />
      </Section>

      <Section title={t.cropToSubject} icon={<Crop className="h-3.5 w-3.5" />} enabled={s.crop} onToggle={s.setCrop}>
        <Slider
          label={t.cropPadding}
          value={Math.round(s.padding * 100)}
          min={0}
          max={30}
          onChange={(v) => s.setPadding(v / 100)}
          format={(v) => `${v}%`}
        />
      </Section>
    </Inspector>
  )
}

function useOutputSize(): [number, number] | null {
  const [source, matte, crop, padding] = useCutout(useShallow((s) => [s.source, s.matte, s.crop, s.padding]))
  return useMemo(() => {
    if (!source || !matte) return null
    const r = cutoutRegion(source.width, source.height, matte, crop, padding)
    return [r.w, r.h]
  }, [source, matte, crop, padding])
}
