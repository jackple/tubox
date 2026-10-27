import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, CircleAlert, Download, ExternalLink, Info, Loader2, MapPin, Plus, ShieldCheck, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Inspector, ToolLayout } from '@/components/layout/ToolLayout'
import { Button } from '@/components/ui/Button'
import { Section, Switch } from '@/components/ui/controls'
import { type MetaReport, hasPrivateInfo } from '@/core/exif/read'
import { type Messages, errorMessage, fmt, plural, useMessages, useRouteLocale } from '@/i18n'
import { localeMeta } from '@/i18n/locales'
import { ACCEPT } from '@/lib/assets'
import { cn } from '@/lib/cn'
import { formatBytes } from '@/lib/format'
import { cachedAddress, osmUrl, reverseGeocode } from '@/lib/geocode'
import { type ExifItem, useExif } from '@/stores/exif'
import { EmptyStage } from '../collage/shared'

export default function ExifPage() {
  const { items, add, clear } = useExif()
  const m = useMessages()
  return (
    <ToolLayout
      toolId="exif"
      actions={
        items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear}>
            <Trash2 className="h-4 w-4" /> {m.common.clear}
          </Button>
        )
      }
      inspector={<ExifInspector />}
    >
      {items.length ? <ExifList /> : <EmptyStage onFiles={add} title={m.exif.emptyTitle} hint={m.exif.emptyHint} />}
    </ToolLayout>
  )
}

function ExifInspector() {
  const { items, options: o, setOptions, download } = useExif()
  const [busy, setBusy] = useState(false)
  const m = useMessages()
  const t = m.exif
  const ready = items.filter((x) => x.cleaned)
  const gps = items.filter((x) => x.report?.gps).length
  const removed = ready.reduce((s, x) => s + Math.max(0, x.file.size - x.cleaned!.blob.size), 0)

  return (
    <Inspector
      footer={
        <div className="space-y-2.5">
          <p className="text-center text-[11px] text-muted">{ready.length ? fmt(t.removed, { size: formatBytes(removed) }) : t.lossless}</p>
          <Button
            variant="primary"
            className="w-full"
            disabled={!ready.length}
            loading={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await download()
              } catch (e) {
                toast.error(m.common.exportFailed, { description: errorMessage(e) })
              } finally {
                setBusy(false)
              }
            }}
          >
            {!busy && <Download className="h-4 w-4" />} {plural(t.download, ready.length)}
          </Button>
        </div>
      }
    >
      <Section title={t.optionsTitle} icon={<ShieldCheck className="h-3.5 w-3.5" />}>
        <ToggleRow
          label={t.keepOrientation}
          hint={t.keepOrientationHint}
          checked={o.keepOrientation}
          onChange={(keepOrientation) => setOptions({ keepOrientation })}
        />
        <ToggleRow
          label={t.keepColorProfile}
          hint={t.keepColorProfileHint}
          checked={o.keepColorProfile}
          onChange={(keepColorProfile) => setOptions({ keepColorProfile })}
        />
      </Section>
      <Section title={t.statsTitle} icon={<Info className="h-3.5 w-3.5" />}>
        <dl className="grid grid-cols-2 gap-2">
          <Stat label={t.statFiles} value={items.length} />
          <Stat label={t.statGps} value={gps} danger={gps > 0} />
          <Stat label={t.statPrivate} value={items.filter((x) => x.report && hasPrivateInfo(x.report)).length} />
          <Stat label={t.statMeta} value={formatBytes(items.reduce((s, x) => s + (x.report?.bytes ?? 0), 0))} />
        </dl>
        <p className="rounded-lg border border-line bg-subtle/60 px-3 py-2 text-[12px] leading-relaxed text-muted">{t.howDesc}</p>
      </Section>
    </Inspector>
  )
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-[13px]">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-muted">{hint}</span>
      </span>
      <Switch checked={checked} onChange={onChange} />
    </label>
  )
}

function Stat({ label, value, danger }: { label: string; value: string | number; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-subtle/40 px-3 py-2.5">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className={cn('mt-0.5 text-[17px] font-semibold tabular-nums tracking-tight', danger && 'text-danger')}>{value}</dd>
    </div>
  )
}

function ExifList() {
  const { items, add } = useExif()
  const input = useRef<HTMLInputElement>(null)
  const m = useMessages()
  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-2 p-4 sm:p-6">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.div key={it.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}>
              <ExifRow item={it} />
            </motion.div>
          ))}
        </AnimatePresence>
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-fg/20 text-[12px] font-medium text-muted transition hover:border-fg/30 hover:bg-fg/[0.03] hover:text-fg"
        >
          <Plus className="h-4 w-4" /> {m.exif.addMore}
        </button>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            add(Array.from(e.target.files ?? []))
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

type Tone = 'danger' | 'warning' | 'neutral'

/** 发现的元数据项：键、语气（位置最敏感）、显示值 */
function findings(r: MetaReport, t: Messages['exif']): { key: string; label: string; tone: Tone; value: string }[] {
  const f = t.fields
  const out: { key: string; label: string; tone: Tone; value: string }[] = []
  if (r.gps) {
    const { lat, lng, alt } = r.gps
    const pos = `${Math.abs(lat).toFixed(6)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(6)}°${lng >= 0 ? 'E' : 'W'}`
    out.push({
      key: 'gps',
      label: f.gps,
      tone: 'danger',
      value: alt === undefined ? pos : `${pos} · ${fmt(t.altitude, { m: Math.round(alt) })}`,
    })
  }
  if (r.device) out.push({ key: 'device', label: f.device, tone: 'warning', value: r.device })
  if (r.serial) out.push({ key: 'serial', label: f.serial, tone: 'warning', value: r.serial })
  if (r.author) out.push({ key: 'author', label: f.author, tone: 'warning', value: r.author })
  if (r.taken) out.push({ key: 'taken', label: f.taken, tone: 'neutral', value: r.taken })
  if (r.lens) out.push({ key: 'lens', label: f.lens, tone: 'neutral', value: r.lens })
  if (r.exposure) out.push({ key: 'exposure', label: f.exposure, tone: 'neutral', value: r.exposure })
  if (r.software) out.push({ key: 'software', label: f.software, tone: 'neutral', value: r.software })
  if (r.description) out.push({ key: 'description', label: f.description, tone: 'neutral', value: r.description })
  if (r.thumbnail) out.push({ key: 'thumbnail', label: f.thumbnail, tone: 'neutral', value: t.thumbnailDesc })
  r.texts.forEach((x, i) => out.push({ key: `text-${i}`, label: x.key, tone: 'neutral', value: x.value }))
  return out
}

const toneClass: Record<Tone, string> = {
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  neutral: 'bg-subtle text-muted',
}

function ExifRow({ item: it }: { item: ExifItem }) {
  const { openId, toggle, remove, download } = useExif()
  const m = useMessages()
  const t = m.exif
  const open = openId === it.id
  const r = it.report
  const list = r ? findings(r, t) : []
  // 收起时只显示前几个标签（文本块可能很多）
  const tags = list.filter((x) => !x.key.startsWith('text-')).slice(0, 5)
  const texts = list.length - list.filter((x) => !x.key.startsWith('text-')).length

  return (
    <div className={cn('overflow-hidden rounded-xl border bg-panel transition-colors', open ? 'border-fg/20 shadow-soft' : 'border-line')}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => toggle(it.id)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle(it.id)}
        className="group flex cursor-pointer items-center gap-3 p-2.5 pr-3"
      >
        {it.thumb ? (
          <img src={it.thumb} alt="" decoding="async" className="h-12 w-12 shrink-0 rounded-lg bg-subtle object-cover" draggable={false} />
        ) : (
          <div className="h-12 w-12 shrink-0 rounded-lg bg-subtle" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium">{it.file.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {it.error ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-danger">
                <CircleAlert className="h-3 w-3" /> {errorMessage(it.error)}
              </span>
            ) : !r ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                <Loader2 className="h-3 w-3 animate-spin" /> {t.reading}
              </span>
            ) : list.length ? (
              <>
                {tags.map((x) => (
                  <span key={x.key} className={cn('rounded-md px-1.5 py-px text-[11px] font-medium', toneClass[x.tone])}>
                    {x.label}
                  </span>
                ))}
                {texts > 0 && (
                  <span className={cn('rounded-md px-1.5 py-px text-[11px] font-medium', toneClass.neutral)}>
                    {plural(t.textCount, texts)}
                  </span>
                )}
              </>
            ) : (
              <span className="rounded-md bg-success/10 px-1.5 py-px text-[11px] font-medium text-success">
                {r.kinds.length ? t.noPrivate : t.noMeta}
              </span>
            )}
          </div>
        </div>
        <div className="hidden shrink-0 text-right font-mono text-[11px] tabular-nums text-muted sm:block">
          {formatBytes(it.file.size)}
          {it.cleaned && (
            <>
              {' → '}
              <span className="text-fg">{formatBytes(it.cleaned.blob.size)}</span>
            </>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          title={m.common.download}
          disabled={!it.cleaned}
          onClick={(e) => {
            e.stopPropagation()
            download([it.id])
          }}
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          title={m.common.remove}
          onClick={(e) => {
            e.stopPropagation()
            remove(it.id)
          }}
        >
          <X className="h-4 w-4" />
        </Button>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted transition-transform', open && 'rotate-180')} />
      </div>

      <AnimatePresence initial={false}>
        {open && r && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-line px-4 py-3">
              {list.length > 0 && (
                <dl className="grid grid-cols-[minmax(80px,auto)_1fr] gap-x-4 gap-y-1.5 text-[12px]">
                  {list.map((x) => (
                    <div key={x.key} className="contents">
                      <dt className={cn('text-muted', x.tone === 'danger' && 'font-medium text-danger')}>{x.label}</dt>
                      <dd className="min-w-0 break-words font-mono text-[11.5px] leading-relaxed">
                        {x.value}
                        {x.key === 'gps' && r.gps && <GpsAddress lat={r.gps.lat} lng={r.gps.lng} />}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                <span>
                  {t.contains}
                  {r.kinds.length ? r.kinds.map((k) => t.kinds[k]).join(' · ') : '—'}
                </span>
                {r.bytes > 0 && <span className="font-mono">{fmt(t.metaSize, { size: formatBytes(r.bytes) })}</span>}
                {it.cleaned?.reencoded && <span className="text-warning">{t.reencoded}</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** 拍摄位置的具体地址：需用户点击才联网查询（坐标会发送给 OpenStreetMap），结果按坐标与语言缓存 */
function GpsAddress({ lat, lng }: { lat: number; lng: number }) {
  const lang = localeMeta(useRouteLocale()).htmlLang
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'error' } | { status: 'done'; address: string }>(() => {
    const address = cachedAddress(lat, lng, lang)
    return address ? { status: 'done', address } : { status: 'idle' }
  })
  const t = useMessages().exif

  const lookup = async () => {
    setState({ status: 'loading' })
    try {
      setState({ status: 'done', address: await reverseGeocode(lat, lng, lang) })
    } catch {
      setState({ status: 'error' })
    }
  }

  return (
    <div className="mt-1.5 space-y-1.5 font-sans text-[12px]" onClick={(e) => e.stopPropagation()}>
      {state.status === 'done' ? (
        <div className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
          <span>
            <span className="font-medium text-fg">{state.address}</span>
            <span className="ml-2 text-[10.5px] text-muted">{t.osmCredit}</span>
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Button size="sm" variant="soft" className="h-7 px-2.5 text-[12px]" loading={state.status === 'loading'} onClick={lookup}>
            {state.status !== 'loading' && <MapPin className="h-3.5 w-3.5" />}
            {state.status === 'error' ? t.lookupRetry : t.lookupAddress}
          </Button>
          <span className={cn('text-[11px]', state.status === 'error' ? 'text-danger' : 'text-muted')}>
            {state.status === 'error' ? t.lookupFailed : t.lookupNote}
          </span>
        </div>
      )}
      <a
        href={osmUrl(lat, lng)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-muted underline-offset-2 hover:text-fg hover:underline"
      >
        {t.openMap} <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  )
}
