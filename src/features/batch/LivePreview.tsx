import { useEffect, useState } from 'react'
import { ImageIcon, Loader2 } from 'lucide-react'
import { CompareSlider } from '@/components/common/CompareSlider'
import type { ProcessResult } from '@/core/batch/types'
import { useDebounced } from '@/hooks/useDebounced'
import { useObjectUrl } from '@/hooks/useObjectUrl'
import { useMessages } from '@/i18n'
import { formatBytes, percentChange } from '@/lib/format'
import { useBatch } from '@/stores/batch'
import { processInPool } from '@/workers/pool'

/** 参数面板顶部的实时预览：参数变化后（防抖）在 Worker 中处理当前选中图片 */
export function LivePreview() {
  const item = useBatch((s) => s.items.find((i) => i.id === s.activeId))
  const options = useDebounced(
    useBatch((s) => s.options),
    300,
  )
  const [res, setRes] = useState<ProcessResult | null>(null)
  const [busy, setBusy] = useState(false)
  const file = item?.file

  useEffect(() => {
    if (!file) return setRes(null)
    let cancelled = false
    setBusy(true)
    processInPool(file, options, { index: 0, name: file.name })
      .then((r) => !cancelled && setRes(r))
      .catch(() => !cancelled && setRes(null))
      .finally(() => !cancelled && setBusy(false))
    return () => {
      cancelled = true
    }
  }, [file, options])

  const url = useObjectUrl(res?.blob)
  const m = useMessages()

  if (!item)
    return (
      <div className="checker grid aspect-[4/3] place-items-center rounded-xl border border-line/70 text-muted">
        <div className="flex flex-col items-center gap-2 text-[12px]">
          <ImageIcon className="h-6 w-6 opacity-60" />
          {m.batch.previewEmpty}
        </div>
      </div>
    )

  const pct = res ? percentChange(item.file.size, res.blob.size) : 0
  return (
    <div className="space-y-2.5">
      <div className="relative overflow-hidden rounded-xl border border-line/70">
        {url ? <CompareSlider before={item.url} after={url} className="aspect-[4/3] w-full" /> : <div className="checker aspect-[4/3]" />}
        {busy && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white backdrop-blur">
            <Loader2 className="h-3 w-3 animate-spin" /> {m.batch.previewing}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] tabular-nums">
        <Stat label={m.common.original} value={formatBytes(item.file.size)} sub={item.width ? `${item.width}×${item.height}` : ''} />
        <Stat
          label={m.batch.estimated}
          value={res ? formatBytes(res.blob.size) : '—'}
          sub={res ? `${res.width}×${res.height}` : ''}
          extra={
            res && (
              <span className={pct <= 0 ? 'text-success' : 'text-warning'}>
                {pct > 0 ? '+' : ''}
                {pct}%
              </span>
            )
          }
        />
      </div>
    </div>
  )
}

function Stat({ label, value, sub, extra }: { label: string; value: string; sub: string; extra?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-subtle px-2.5 py-2">
      <div className="flex items-center justify-between text-muted">
        {label}
        <b className="font-semibold">{extra}</b>
      </div>
      <div className="mt-0.5 text-[13px] font-semibold text-fg">{value}</div>
      <div className="text-muted">{sub}</div>
    </div>
  )
}
