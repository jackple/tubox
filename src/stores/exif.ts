import { create } from 'zustand'
import { toast } from 'sonner'
import { canvasToBlob, createCanvas, decodeImage, getCtx } from '@/core/canvas'
import { type MetaReport, readMetadata } from '@/core/exif/read'
import { type StripOptions, stripMetadata } from '@/core/exif/strip'
import { fmt, getMessages, plural } from '@/i18n'
import { isImageFile } from '@/lib/assets'
import { saveFiles, timestamp } from '@/lib/download'
import { uid } from '@/lib/format'

export const EXIF_MAX_FILES = 200

export interface ExifItem {
  id: string
  file: File
  /** 缩略图地址（原文件的 object URL） */
  url: string
  report: MetaReport | null
  /** 清除后的文件；reencoded 表示格式不支持无损清除，已重新编码为 PNG */
  cleaned: { blob: Blob; reencoded: boolean } | null
  error: string | null
}

interface ExifState {
  items: ExifItem[]
  options: StripOptions
  /** 展开详情的条目 */
  openId: string | null
  add: (files: File[]) => Promise<void>
  remove: (id: string) => void
  clear: () => void
  toggle: (id: string) => void
  setOptions: (p: Partial<StripOptions>) => void
  download: (ids?: string[]) => Promise<void>
}

async function clean(file: File, report: MetaReport, o: StripOptions): Promise<ExifItem['cleaned']> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const out = stripMetadata(bytes, o, report.orientation)
  if (out) return { blob: new Blob([out], { type: file.type || 'application/octet-stream' }), reencoded: false }
  // AVIF / HEIC / BMP 等：解码后重新编码为 PNG（画布输出天然不含元数据）
  const bitmap = await decodeImage(file)
  try {
    const c = createCanvas(bitmap.width, bitmap.height)
    getCtx(c).drawImage(bitmap, 0, 0)
    return { blob: await canvasToBlob(c, 'image/png'), reencoded: true }
  } finally {
    bitmap.close()
  }
}

/** 清除后的文件名：重新编码时扩展名改为 .png */
export const cleanedName = (it: ExifItem) => (it.cleaned?.reencoded ? it.file.name.replace(/\.[^.]+$/, '') + '.png' : it.file.name)

export const useExif = create<ExifState>((set, get) => {
  /** 按当前选项（重新）清除，结果写回对应条目 */
  const process = async (targets: ExifItem[]) => {
    const o = get().options
    const queue = [...targets]
    // 限制并发，避免一次拖入大量原图时同时读入内存
    const worker = async () => {
      for (let it = queue.shift(); it; it = queue.shift()) {
        let patch: Partial<ExifItem>
        try {
          const report = it.report ?? readMetadata(new Uint8Array(await it.file.arrayBuffer()))
          patch = { report, cleaned: await clean(it.file, report, o), error: null }
        } catch (e) {
          patch = { cleaned: null, error: e instanceof Error ? e.message : String(e) }
        }
        // 处理期间选项可能已变化，旧结果丢弃（新一轮会覆盖）
        if (get().options !== o) return
        const id = it.id
        set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
      }
    }
    await Promise.all(Array.from({ length: 4 }, worker))
  }

  return {
    items: [],
    options: { keepOrientation: true, keepColorProfile: true },
    openId: null,

    add: async (files) => {
      const m = getMessages()
      const images = files.filter(isImageFile)
      const room = EXIF_MAX_FILES - get().items.length
      if (images.length < files.length) toast.warning(plural(m.batch.ignored, files.length - images.length))
      if (room <= 0) return void toast.warning(fmt(m.assets.max, { max: EXIF_MAX_FILES }))
      if (images.length > room) toast.warning(plural(m.assets.truncated, room))
      const fresh: ExifItem[] = images
        .slice(0, room)
        .map((file) => ({ id: uid(), file, url: URL.createObjectURL(file), report: null, cleaned: null, error: null }))
      if (!fresh.length) return
      set((s) => ({ items: [...s.items, ...fresh] }))
      await process(fresh)
    },

    remove: (id) => {
      const it = get().items.find((x) => x.id === id)
      if (it) URL.revokeObjectURL(it.url)
      set((s) => ({ items: s.items.filter((x) => x.id !== id) }))
    },

    clear: () => {
      get().items.forEach((x) => URL.revokeObjectURL(x.url))
      set({ items: [], openId: null })
    },

    toggle: (id) => set((s) => ({ openId: s.openId === id ? null : id })),

    setOptions: (p) => {
      set((s) => ({ options: { ...s.options, ...p }, items: s.items.map((x) => (x.report ? { ...x, cleaned: null } : x)) }))
      void process(get().items.filter((x) => x.report))
    },

    download: async (ids) => {
      const list = get().items.filter((x) => x.cleaned && (!ids || ids.includes(x.id)))
      await saveFiles(
        list.map((x) => ({ name: cleanedName(x), blob: x.cleaned!.blob })),
        `${getMessages().exif.fileName}-${timestamp()}.zip`,
      )
    },
  }
})
