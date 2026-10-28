import { useState } from 'react'
import { Download, Info, Maximize2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Inspector } from '@/components/layout/ToolLayout'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/controls'
import { Segmented } from '@/components/ui/Segmented'
import { type UpscaleScale, planUpscale } from '@/core/upscale/upscale'
import { errorMessage, fmt, useMessages } from '@/i18n'
import { type UpscaleFormat, useUpscale } from '@/stores/upscale'

export function UpscaleInspector() {
  const s = useUpscale()
  const [busy, setBusy] = useState(false)
  const m = useMessages()
  const t = m.upscale

  const plan = s.source ? planUpscale(s.source.width, s.source.height, s.scale) : null
  const running = s.status === 'model' || s.status === 'upscale'
  // 放大倍数改过后，已有结果不再对应当前设置
  const fresh = !!s.result && s.result.scale === s.scale

  return (
    <Inspector
      footer={
        <div className="space-y-2.5">
          {s.result && !fresh && !running && <p className="text-center text-[11px] text-warning">{t.stale}</p>}
          <div className="flex justify-between text-[11px] text-muted">
            <span>{t.outputSize}</span>
            <span className="font-mono tabular-nums">{plan ? `${plan.ow}×${plan.oh}px` : '—'}</span>
          </div>
          <div className="flex gap-2">
            <Segmented<UpscaleFormat>
              size="sm"
              className="w-[156px]"
              value={s.format}
              onChange={s.setFormat}
              options={[
                { value: 'image/png', label: 'PNG' },
                { value: 'image/webp', label: 'WebP' },
                { value: 'image/jpeg', label: 'JPG' },
              ]}
            />
            {fresh ? (
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
            ) : (
              <Button variant="primary" className="flex-1" disabled={!s.source} loading={running} onClick={() => s.run()}>
                {!running && <Sparkles className="h-4 w-4" />} {s.result ? t.restart : t.start}
              </Button>
            )}
          </div>
          {s.alpha && s.format === 'image/jpeg' && <p className="text-center text-[11px] text-muted">{t.jpgFill}</p>}
        </div>
      }
    >
      <Section title={t.scaleTitle} icon={<Maximize2 className="h-3.5 w-3.5" />}>
        <Segmented<`${UpscaleScale}`>
          value={`${s.scale}`}
          onChange={(v) => s.setScale(Number(v) as UpscaleScale)}
          options={[
            { value: '2', label: '2×' },
            { value: '4', label: '4×' },
          ]}
        />
        {plan && (
          <p className="font-mono text-[11px] tabular-nums text-muted">
            {fmt(t.sizeChange, { w: plan.w, h: plan.h, ow: plan.ow, oh: plan.oh })}
          </p>
        )}
        {plan?.limited && <p className="text-[11px] leading-relaxed text-warning">{fmt(t.limited, { w: plan.w, h: plan.h })}</p>}
      </Section>

      <Section title={t.aboutTitle} icon={<Info className="h-3.5 w-3.5" />}>
        <p className="text-[12px] leading-relaxed text-muted">{t.aboutDesc}</p>
      </Section>
    </Inspector>
  )
}
