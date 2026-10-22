import { motion } from 'framer-motion'
import { CircleAlert, Columns2, Download, X } from 'lucide-react'
import { Badge } from '@/components/ui/controls'
import { cn } from '@/lib/cn'
import { saveBlob } from '@/lib/download'
import { formatBytes, percentChange } from '@/lib/format'
import { type BatchItem, useBatch } from '@/stores/batch'

export function FileCard({ item, version, onCompare }: { item: BatchItem; version: number; onCompare: () => void }) {
  const { activeId, setActive, remove } = useBatch()
  const active = activeId === item.id
  const r = item.result
  const pct = r ? percentChange(item.file.size, r.blob.size) : 0
  const stale = r && r.version !== version
  const src = r ? (r.thumb ?? r.url) : item.thumb

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.2 }}
      onClick={() => setActive(item.id)}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-2xl border bg-panel p-1.5 shadow-xs transition-all',
        active ? 'border-fg shadow-[0_0_0_1px_rgb(var(--fg))]' : 'border-line/80 hover:border-fg/15 hover:shadow-soft',
      )}
    >
      <div className="checker relative aspect-[4/3] overflow-hidden rounded-xl">
        {src && <img src={src} alt="" decoding="async" className="h-full w-full object-cover" draggable={false} />}
        {item.status === 'processing' && (
          <div className="absolute inset-0 overflow-hidden bg-black/30 backdrop-blur-[2px]">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="absolute inset-0 grid place-items-center text-[12px] font-semibold text-white">处理中…</div>
          </div>
        )}
        <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100">
          {r && (
            <>
              <IconBtn title="对比" onClick={onCompare}>
                <Columns2 className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn title="下载" onClick={() => saveBlob(r.blob, r.name)}>
                <Download className="h-3.5 w-3.5" />
              </IconBtn>
            </>
          )}
          <IconBtn title="移除" onClick={() => remove(item.id)}>
            <X className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>

      <div className="px-1.5 pb-1 pt-2">
        <div className="truncate text-[12px] font-medium" title={r?.name ?? item.file.name}>
          {r?.name ?? item.file.name}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] tabular-nums text-muted">
          {item.status === 'error' ? (
            <span className="flex items-center gap-1 text-danger" title={item.error}>
              <CircleAlert className="h-3.5 w-3.5" /> 失败
            </span>
          ) : r ? (
            <>
              <span className={cn(stale && 'line-through opacity-60')}>
                {formatBytes(r.blob.size)} · {r.width}×{r.height}
              </span>
              <Badge tone={stale ? 'neutral' : pct <= 0 ? 'success' : 'warning'} className="ml-auto">
                {stale ? '待更新' : `${pct > 0 ? '+' : ''}${pct}%`}
              </Badge>
            </>
          ) : (
            <span>
              {formatBytes(item.file.size)}
              {item.width && ` · ${item.width}×${item.height}`}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="grid h-7 w-7 place-items-center rounded-lg bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
    >
      {children}
    </button>
  )
}
