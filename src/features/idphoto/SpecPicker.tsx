import { useMemo, useState } from 'react'
import { Flame, Search } from 'lucide-react'
import { Portrait } from '@/components/common/Portrait'
import { Field, NumberInput } from '@/components/ui/controls'
import { backgrounds, photoSpecs, type SpecCategory, specCategories, specSizeLabel } from '@/core/idphoto/specs'
import { fmt, useMessages, useRouteLocale } from '@/i18n'
import { isChinese } from '@/i18n/locales'
import { cn } from '@/lib/cn'
import { CUSTOM_ID, specName, useIdPhoto } from '@/stores/idphoto'

type Tab = SpecCategory | 'custom'

export function SpecPicker() {
  const { specId, setSpec, customPx, setCustomPx } = useIdPhoto()
  const [tab, setTab] = useState<Tab>(() =>
    specId === CUSTOM_ID ? 'custom' : (photoSpecs.find((s) => s.id === specId)?.category ?? 'common'),
  )
  const [q, setQ] = useState('')
  const m = useMessages()
  const t = m.idphoto
  // 非中文界面把各国护照放在最前
  const categories: SpecCategory[] = isChinese(useRouteLocale())
    ? specCategories
    : ['world', ...specCategories.filter((c) => c !== 'world')]

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return kw ? photoSpecs.filter((s) => specName(m, s.id).toLowerCase().includes(kw)) : photoSpecs.filter((s) => s.category === tab)
  }, [q, tab, m])

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 p-4 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder={t.searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {!q && (
          <div className="flex flex-wrap gap-1">
            {[...categories, 'custom' as const].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setTab(c)
                  if (c === 'custom') setSpec(CUSTOM_ID)
                }}
                className={cn(
                  'h-7 rounded-lg px-2.5 text-[12px] font-medium transition',
                  tab === c ? 'bg-fg text-bg' : 'text-muted hover:bg-subtle hover:text-fg',
                )}
              >
                {c === 'custom' ? m.common.custom : t.categories[c]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 pb-4">
        {tab === 'custom' && !q ? (
          <div className="space-y-3 rounded-xl border border-line/70 p-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label={t.customWidth}>
                <NumberInput value={customPx[0]} suffix="px" onChange={(v) => setCustomPx([Math.max(50, v ?? 50), customPx[1]])} />
              </Field>
              <Field label={t.customHeight}>
                <NumberInput value={customPx[1]} suffix="px" onChange={(v) => setCustomPx([customPx[0], Math.max(50, v ?? 50)])} />
              </Field>
            </div>
            <p className="text-[11px] leading-relaxed text-muted">{t.customHint}</p>
          </div>
        ) : (
          <>
            {tab === 'world' && !q && (
              <p className="mx-1 mb-2 rounded-lg bg-subtle px-3 py-2 text-[11px] leading-relaxed text-muted">{t.worldNote}</p>
            )}
            {tab === 'exam' && !q && (
              <p className="mx-1 mb-2 rounded-lg bg-warning/10 px-3 py-2 text-[11px] leading-relaxed text-warning">{t.examNote}</p>
            )}
            {list.map((s) => {
              const active = s.id === specId
              const ratio = s.px[0] / s.px[1]
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSpec(s.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all',
                    active
                      ? 'border-line bg-panel shadow-[var(--highlight),0_1px_3px_rgb(0_0_0/0.08),0_0_0_1px_rgb(var(--fg))]'
                      : 'border-transparent hover:bg-fg/[0.04]',
                  )}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-subtle">
                    <span
                      className="relative overflow-hidden rounded-[3px] ring-1 ring-black/10"
                      style={{
                        width: ratio >= 1 ? 30 : 30 * ratio,
                        height: ratio >= 1 ? 30 / ratio : 30,
                        background: backgrounds[s.backgrounds[0]].swatch,
                      }}
                    >
                      <Portrait className="absolute bottom-0 left-1/2 w-[92%] -translate-x-1/2" />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-[13px] font-semibold">
                      {specName(m, s.id)}
                      {s.hot && <Flame className="h-3 w-3 text-accent" />}
                    </span>
                    <span className="block text-[11px] tabular-nums text-muted">
                      {specSizeLabel(s)} · {s.px[0]}×{s.px[1]}
                      {s.maxKB && ` · ≤${s.maxKB}KB`}
                    </span>
                  </span>
                  <span className="flex -space-x-1">
                    {s.backgrounds.slice(0, 3).map((b) => (
                      <span
                        key={b}
                        className="h-3.5 w-3.5 rounded-full ring-2 ring-panel"
                        style={{ background: backgrounds[b].swatch, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }}
                      />
                    ))}
                  </span>
                </button>
              )
            })}
            {!list.length && <div className="py-10 text-center text-[12px] text-muted">{fmt(t.notFound, { q })}</div>}
          </>
        )}
      </div>
    </div>
  )
}
