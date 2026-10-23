import { create } from 'zustand'
import { toast } from 'sonner'
import { type BatchOptions, defaultBatchOptions } from '@/core/batch/types'
import { fmt, getMessages, plural } from '@/i18n'
import { isImageFile } from '@/lib/assets'
import { saveFiles, timestamp } from '@/lib/download'
import { uid } from '@/lib/format'
import { probeInPool, processInPool } from '@/workers/pool'

export type ItemStatus = 'idle' | 'processing' | 'done' | 'error'

export interface BatchResult {
  blob: Blob
  url: string
  /** 列表缩略图 object URL */
  thumb?: string
  name: string
  width: number
  height: number
  /** 生成该结果时的参数版本，用于判断结果是否过期 */
  version: number
}

export interface BatchItem {
  id: string
  file: File
  url: string
  /** 列表缩略图 object URL；生成失败时回退为原图 url */
  thumb?: string
  width?: number
  height?: number
  status: ItemStatus
  result?: BatchResult
  error?: string
}

/** 名称与说明见 i18n/messages 的 batch.presets */
export interface BatchPreset {
  id: 'wechat' | 'web' | 'shop' | 'xhs' | 'ig' | 'mail'
  /** cn：国内平台；非中文界面把这类预设排在后面 */
  region?: 'cn'
  apply: (o: BatchOptions) => BatchOptions
}

export const batchPresets: BatchPreset[] = [
  {
    id: 'wechat',
    region: 'cn',
    apply: (o) => ({
      ...o,
      resize: { ...o.resize, enabled: true, mode: 'long', width: 1920 },
      output: { ...o.output, format: 'image/jpeg', quality: 80, targetKB: null },
    }),
  },
  {
    id: 'web',
    apply: (o) => ({
      ...o,
      resize: { ...o.resize, enabled: true, mode: 'long', width: 1600 },
      output: { ...o.output, format: 'image/webp', quality: 78, targetKB: null },
    }),
  },
  {
    id: 'shop',
    apply: (o) => ({
      ...o,
      resize: { ...o.resize, enabled: true, mode: 'cover', width: 800, height: 800, noEnlarge: false },
      output: { ...o.output, format: 'image/jpeg', quality: 88, targetKB: null },
    }),
  },
  {
    id: 'xhs',
    region: 'cn',
    apply: (o) => ({
      ...o,
      resize: { ...o.resize, enabled: true, mode: 'cover', width: 1242, height: 1656, noEnlarge: false },
      output: { ...o.output, format: 'image/jpeg', quality: 90, targetKB: null },
    }),
  },
  {
    id: 'ig',
    apply: (o) => ({
      ...o,
      resize: { ...o.resize, enabled: true, mode: 'cover', width: 1080, height: 1350, noEnlarge: false },
      output: { ...o.output, format: 'image/jpeg', quality: 90, targetKB: null },
    }),
  },
  {
    id: 'mail',
    apply: (o) => ({ ...o, output: { ...o.output, format: 'image/jpeg', quality: 85, targetKB: 500 } }),
  },
]

interface BatchState {
  items: BatchItem[]
  activeId: string | null
  options: BatchOptions
  version: number
  running: boolean
  progress: { done: number; total: number }

  addFiles: (files: File[]) => void
  remove: (id: string) => void
  clear: () => void
  setActive: (id: string | null) => void
  patch: <K extends keyof BatchOptions>(key: K, value: Partial<BatchOptions[K]>) => void
  applyPreset: (p: BatchPreset) => void
  reset: () => void
  run: () => Promise<void>
  downloadAll: () => Promise<void>
}

function revokeResult(r?: BatchResult) {
  if (!r) return
  URL.revokeObjectURL(r.url)
  if (r.thumb) URL.revokeObjectURL(r.thumb)
}

function revoke(item: BatchItem) {
  URL.revokeObjectURL(item.url)
  if (item.thumb) URL.revokeObjectURL(item.thumb)
  revokeResult(item.result)
}

export const useBatch = create<BatchState>((set, get) => {
  const update = (id: string, patch: Partial<BatchItem>) =>
    set((s) => ({ items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }))

  return {
    items: [],
    activeId: null,
    options: defaultBatchOptions,
    version: 0,
    running: false,
    progress: { done: 0, total: 0 },

    addFiles: (files) => {
      const imgs = files.filter(isImageFile)
      if (imgs.length < files.length) toast.warning(plural(getMessages().batch.ignored, files.length - imgs.length))
      if (!imgs.length) return
      const added: BatchItem[] = imgs.map((file) => ({ id: uid(), file, url: URL.createObjectURL(file), status: 'idle' }))
      set((s) => ({ items: [...s.items, ...added], activeId: s.activeId ?? added[0].id }))
      added.forEach(async (it) => {
        try {
          const { width, height, thumb } = await probeInPool(it.file)
          const url = URL.createObjectURL(thumb)
          if (get().items.some((i) => i.id === it.id)) update(it.id, { width, height, thumb: url })
          else URL.revokeObjectURL(url)
        } catch {
          update(it.id, { thumb: it.url })
        }
      })
    },

    remove: (id) =>
      set((s) => {
        const it = s.items.find((i) => i.id === id)
        if (it) revoke(it)
        const items = s.items.filter((i) => i.id !== id)
        return { items, activeId: s.activeId === id ? (items[0]?.id ?? null) : s.activeId }
      }),

    clear: () => {
      get().items.forEach(revoke)
      set({ items: [], activeId: null, progress: { done: 0, total: 0 } })
    },

    setActive: (id) => set({ activeId: id }),

    patch: (key, value) => set((s) => ({ options: { ...s.options, [key]: { ...s.options[key], ...value } }, version: s.version + 1 })),

    applyPreset: (p) => set((s) => ({ options: p.apply(s.options), version: s.version + 1 })),

    reset: () => set((s) => ({ options: defaultBatchOptions, version: s.version + 1 })),

    run: async () => {
      const { items, options, version, running } = get()
      if (running || !items.length) return
      const todo = items.filter((it) => !(it.status === 'done' && it.result?.version === version))
      set({ running: true, progress: { done: items.length - todo.length, total: items.length } })
      const t0 = performance.now()

      await Promise.all(
        todo.map(async (it) => {
          update(it.id, { status: 'processing', error: undefined })
          try {
            const index = get().items.findIndex((i) => i.id === it.id)
            const { thumb, ...r } = await processInPool(it.file, options, { index, name: it.file.name, thumb: true })
            const prev = get().items.find((i) => i.id === it.id)
            if (!prev) return
            revokeResult(prev.result)
            const result = { ...r, url: URL.createObjectURL(r.blob), thumb: thumb && URL.createObjectURL(thumb), version }
            update(it.id, { status: 'done', result })
          } catch (e) {
            update(it.id, { status: 'error', error: e instanceof Error ? e.message : String(e) })
          } finally {
            set((s) => ({ progress: { ...s.progress, done: s.progress.done + 1 } }))
          }
        }),
      )

      set({ running: false })
      const failed = get().items.filter((i) => i.status === 'error').length
      const secs = ((performance.now() - t0) / 1000).toFixed(1)
      const m = getMessages().batch
      if (failed) toast.error(plural(m.failedToast, failed), { description: m.failedDesc })
      else toast.success(plural(m.doneToast, todo.length), { description: fmt(m.doneDesc, { secs }) })
    },

    downloadAll: async () => {
      const files = get().items.flatMap((i) => (i.result ? [{ name: i.result.name, blob: i.result.blob }] : []))
      if (!files.length) return void toast.info(getMessages().batch.runFirst)
      await saveFiles(files, `tubox-batch-${timestamp()}.zip`)
    },
  }
})
