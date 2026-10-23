import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, X } from 'lucide-react'
import { CompareSlider } from '@/components/common/CompareSlider'
import { Button } from '@/components/ui/Button'
import { saveBlob } from '@/lib/download'
import { useMessages } from '@/i18n'
import { formatBytes, percentChange } from '@/lib/format'
import { useBatch } from '@/stores/batch'

export function CompareModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const item = useBatch((s) => s.items.find((i) => i.id === id))
  const m = useMessages()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const r = item?.result
  return (
    <AnimatePresence>
      {item && r && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md sm:p-10"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 10 }}
            className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-line/50 bg-panel shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 border-b border-line/70 px-5 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold">{r.name}</div>
                <div className="text-[12px] tabular-nums text-muted">
                  {formatBytes(item.file.size)} · {item.width}×{item.height}
                  <span className="mx-1.5">→</span>
                  <b className="text-fg">{formatBytes(r.blob.size)}</b> · {r.width}×{r.height}
                  <span className="ml-2 font-semibold text-success">{percentChange(item.file.size, r.blob.size)}%</span>
                </div>
              </div>
              <Button size="sm" onClick={() => saveBlob(r.blob, r.name)}>
                <Download className="h-4 w-4" /> {m.common.download}
              </Button>
              <Button size="icon" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CompareSlider before={item.url} after={r.url} className="h-[70vh] w-full" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
