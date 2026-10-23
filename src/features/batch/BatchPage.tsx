import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Plus, Trash2 } from 'lucide-react'
import { Dropzone } from '@/components/common/Dropzone'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { Button } from '@/components/ui/Button'
import { pluralTemplate, rich, useMessages } from '@/i18n'
import { formatBytes, percentChange } from '@/lib/format'
import { useBatch } from '@/stores/batch'
import { BatchInspector } from './BatchInspector'
import { CompareModal } from './CompareModal'
import { FileCard } from './FileCard'

export default function BatchPage() {
  const { items, addFiles, clear, running, downloadAll, progress, version } = useBatch()
  const [compareId, setCompareId] = useState<string | null>(null)

  const total = items.reduce((s, i) => s + i.file.size, 0)
  const done = items.filter((i) => i.result)
  const outTotal = done.reduce((s, i) => s + i.result!.blob.size, 0)
  const inTotalDone = done.reduce((s, i) => s + i.file.size, 0)
  const stale = items.some((i) => !i.result || i.result.version !== version)
  const m = useMessages()
  const t = m.batch

  return (
    <ToolLayout
      toolId="batch"
      actions={
        items.length > 0 && (
          <>
            <Button variant="ghost" size="sm" onClick={clear} disabled={running}>
              <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">{m.common.clear}</span>
            </Button>
            <Button size="sm" variant={stale ? 'secondary' : 'primary'} onClick={downloadAll} disabled={!done.length || running}>
              <Download className="h-4 w-4" /> {t.downloadAll}
              {done.length > 1 && ' (ZIP)'}
            </Button>
          </>
        )
      }
      inspector={<BatchInspector />}
    >
      {items.length === 0 ? (
        <div className="absolute inset-0 grid place-items-center p-6">
          <Dropzone onFiles={addFiles} className="h-full max-h-[440px] w-full max-w-[640px]" title={t.dropTitle} hint={t.dropHint} />
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col">
          <div className="flex shrink-0 items-center gap-4 px-6 pb-2 pt-5 text-[12px] text-muted">
            <span>
              {rich(pluralTemplate(t.total, items.length), {
                count: <b className="text-fg">{items.length}</b>,
                size: formatBytes(total),
              })}
            </span>
            {done.length > 0 && (
              <span>
                {rich(t.output, { size: <b className="text-fg">{formatBytes(outTotal)}</b> })}
                <span className="ml-1.5 font-semibold text-success">{percentChange(inTotalDone, outTotal)}%</span>
              </span>
            )}
            <label className="ml-auto inline-flex cursor-pointer items-center gap-1 font-medium text-fg hover:underline">
              <Plus className="h-3.5 w-3.5" />
              {t.addMore}
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => (addFiles(Array.from(e.target.files ?? [])), (e.target.value = ''))}
              />
            </label>
          </div>
          {running && (
            <div className="mx-6 h-1 shrink-0 overflow-hidden rounded-full bg-line/60">
              <motion.div
                className="bg-brand-gradient h-full"
                animate={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
              />
            </div>
          )}
          <div
            className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              addFiles(Array.from(e.dataTransfer.files))
            }}
          >
            <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-3">
              <AnimatePresence initial={false}>
                {items.map((it) => (
                  <FileCard key={it.id} item={it} version={version} onCompare={() => setCompareId(it.id)} />
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      )}
      <CompareModal id={compareId} onClose={() => setCompareId(null)} />
    </ToolLayout>
  )
}
