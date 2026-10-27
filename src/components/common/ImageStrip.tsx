import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GripVertical, Plus, X } from 'lucide-react'
import { ACCEPT, type ImageAsset } from '@/lib/assets'
import { useMessages } from '@/i18n'
import { cn } from '@/lib/cn'

interface Props {
  images: ImageAsset[]
  onAdd: (files: File[]) => void
  onRemove: (id: string) => void
  onMove: (from: number, to: number) => void
  max?: number
  /** list：单列带文件名；grid：两列缩略图 */
  variant?: 'list' | 'grid'
}

/** 素材栏：缩略图列表，支持原生拖拽排序 */
export function ImageStrip({ images, onAdd, onRemove, onMove, max = Infinity, variant = 'grid' }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const m = useMessages()

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold">{m.strip.title}</span>
        <span className="text-[12px] tabular-nums text-muted">
          {images.length}
          {Number.isFinite(max) && ` / ${max}`} · {m.strip.reorder}
        </span>
      </div>
      <div className={cn('grid gap-2', variant === 'grid' ? 'grid-cols-3 lg:grid-cols-2' : 'grid-cols-1')}>
        <AnimatePresence initial={false}>
          {images.map((img, i) => (
            <motion.div
              key={img.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              {/* framer-motion 占用了 onDrag* 手势属性，原生拖拽放在内层 div 上 */}
              <div
                draggable
                onDragStart={(e) => {
                  setDragIndex(i)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverIndex(i)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (dragIndex !== null && dragIndex !== i) onMove(dragIndex, i)
                  setDragIndex(null)
                  setOverIndex(null)
                }}
                onDragEnd={() => {
                  setDragIndex(null)
                  setOverIndex(null)
                }}
                className={cn(
                  'group relative cursor-grab overflow-hidden rounded-xl border bg-subtle active:cursor-grabbing',
                  variant === 'grid' ? 'aspect-square' : 'flex h-14 items-center gap-3 pr-2',
                  overIndex === i && dragIndex !== i ? 'border-fg ring-1 ring-fg' : 'border-line/70',
                  dragIndex === i && 'opacity-40',
                )}
              >
                <img
                  src={img.thumb}
                  alt=""
                  decoding="async"
                  draggable={false}
                  className={cn('object-cover', variant === 'grid' ? 'h-full w-full' : 'h-full w-14 shrink-0')}
                />
                {variant === 'list' && (
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-medium">{img.name}</div>
                    <div className="text-[11px] tabular-nums text-muted">
                      {img.width}×{img.height}
                    </div>
                  </div>
                )}
                <span className="absolute left-1.5 top-1.5 grid h-5 min-w-5 place-items-center rounded-md bg-black/55 px-1 text-[10px] font-semibold tabular-nums text-white backdrop-blur">
                  {i + 1}
                </span>
                {variant === 'list' && <GripVertical className="h-4 w-4 shrink-0 text-muted" />}
                <button
                  type="button"
                  onClick={() => onRemove(img.id)}
                  title={m.common.remove}
                  className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-md bg-black/55 text-white opacity-0 backdrop-blur transition group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {images.length < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className={cn(
              'grid place-items-center rounded-xl border border-dashed border-fg/20 text-muted transition hover:border-fg/30 hover:bg-fg/[0.03] hover:text-fg',
              variant === 'grid' ? 'aspect-square' : 'h-14',
            )}
          >
            <span className="flex items-center gap-1.5 text-[12px] font-medium">
              <Plus className="h-4 w-4" /> {m.strip.add}
            </span>
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          onAdd(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
      />
    </div>
  )
}
