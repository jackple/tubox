import { type ComponentType, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ImagePlus } from 'lucide-react'
import { ACCEPT } from '@/lib/assets'
import { useMessages } from '@/i18n'
import { cn } from '@/lib/cn'

interface DropzoneProps {
  onFiles: (files: File[]) => void
  multiple?: boolean
  title?: ReactNode
  hint?: ReactNode
  /** 监听全局粘贴（Ctrl/⌘+V） */
  pasteable?: boolean
  className?: string
  compact?: boolean
  children?: ReactNode
  /** 可选文件类型，默认图片 */
  accept?: string
  /** 底部格式说明，默认图片格式 */
  formats?: string
  /** 卡片中央图标，默认 ImagePlus */
  icon?: ComponentType<{ className?: string }>
}

/** 拖拽 / 点击 / 粘贴 三合一的上传区域 */
export function Dropzone({
  onFiles,
  multiple = true,
  title,
  hint,
  pasteable = true,
  className,
  compact,
  children,
  accept = ACCEPT,
  formats = 'JPG · PNG · WEBP · GIF · AVIF',
  icon,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const depth = useRef(0)
  const m = useMessages()

  const emit = useCallback(
    (list: FileList | File[] | null) => {
      const files = Array.from(list ?? [])
      if (files.length) onFiles(multiple ? files : files.slice(0, 1))
    },
    [onFiles, multiple],
  )

  useEffect(() => {
    if (!pasteable) return
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? [])
      if (files.length) emit(files)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [emit, pasteable])

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      onDragEnter={(e) => {
        e.preventDefault()
        depth.current++
        setOver(true)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        if (--depth.current <= 0) setOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        depth.current = 0
        setOver(false)
        emit(e.dataTransfer.files)
      }}
      className={cn(
        'group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[22px] border bg-panel text-center outline-none transition-all duration-300 focus-visible:ring-4 focus-visible:ring-brand/20',
        over ? 'scale-[1.01] border-brand/60 shadow-glow' : 'border-line shadow-[var(--highlight),var(--shadow-soft)] hover:border-fg/20',
        compact ? 'gap-3 p-5' : 'gap-5 p-10',
        className,
      )}
    >
      {/* 内嵌虚线框 + 顶部光晕 */}
      <span
        className={cn(
          'pointer-events-none absolute inset-2 rounded-2xl border border-dashed transition-colors',
          over ? 'border-brand/50 bg-brand/[0.04]' : 'border-fg/[0.12] group-hover:border-fg/25',
        )}
      />
      <span className="pointer-events-none absolute -top-24 left-1/2 h-48 w-2/3 -translate-x-1/2 rounded-full bg-brand/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100 dark:bg-brand/15 sm:opacity-60" />
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          emit(e.target.files)
          e.target.value = ''
        }}
      />
      {children ?? (
        <>
          <FannedCards compact={compact} active={over} icon={icon} />
          <div className="relative space-y-1.5">
            <div className={cn('font-semibold tracking-tight', compact ? 'text-[13px]' : 'text-[18px]')}>
              {title ?? (over ? m.dropzone.release : m.dropzone.title)}
            </div>
            <div className="text-[13px] text-muted">{hint ?? m.dropzone.hint}</div>
          </div>
          {!compact && (
            <div className="relative flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-[12px] text-muted">
                <span className="inline-flex h-8 items-center rounded-lg border border-line bg-panel px-3 font-medium text-fg shadow-[var(--highlight),0_1px_2px_rgb(0_0_0/0.05)]">
                  {m.dropzone.choose}
                </span>
                <span>{m.dropzone.orPaste}</span>
                <span className="kbd">⌘</span>
                <span className="kbd">V</span>
              </div>
              <div className="font-mono text-[10px] tracking-[0.12em] text-muted/70">{formats}</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** 扇形展开的三张卡片，拖入时散开 */
function FannedCards({
  compact,
  active,
  icon: Icon = ImagePlus,
}: {
  compact?: boolean
  active: boolean
  icon?: ComponentType<{ className?: string }>
}) {
  const size = compact ? 'h-10 w-9' : 'h-16 w-14'
  const spread = compact ? 10 : 18
  return (
    <div className={cn('relative', compact ? 'h-11 w-20' : 'h-20 w-32')}>
      {[-1, 1].map((d) => (
        <motion.span
          key={d}
          className={cn('icon-tile absolute left-1/2 top-1/2 rounded-xl', size)}
          style={{ marginLeft: compact ? -18 : -28, marginTop: compact ? -20 : -32 }}
          animate={{ x: d * (active ? spread * 1.5 : spread), rotate: d * (active ? 16 : 9), y: active ? 4 : 2 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        />
      ))}
      <motion.span
        className={cn('icon-tile absolute left-1/2 top-1/2 rounded-xl', size)}
        style={{ marginLeft: compact ? -18 : -28, marginTop: compact ? -20 : -32 }}
        animate={{ y: active ? -6 : 0, scale: active ? 1.06 : 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Icon className={cn(compact ? 'h-4 w-4' : 'h-6 w-6')} />
      </motion.span>
    </div>
  )
}
