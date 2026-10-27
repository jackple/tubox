import { create } from 'zustand'
import { toast } from 'sonner'
import { createCanvas, getCtx } from '@/core/canvas'
import { type GifOptions, defaultGifOptions, drawFrame, gifSize, planFrames } from '@/core/gif/frames'
import { fmt, getMessages } from '@/i18n'
import { saveBlob, timestamp } from '@/lib/download'
import { formatBytes } from '@/lib/format'
import { encodeGifInWorker } from '@/workers/gif'
import { type AssetList, assetList } from './collage'

export const GIF_MAX_IMAGES = 60

interface GifState extends AssetList {
  options: GifOptions
  patch: (p: Partial<GifOptions>) => void
  /** 导出进度（0-1），null 表示未在导出 */
  progress: number | null
  exportGif: () => Promise<void>
}

export const useGif = create<GifState>((set, get) => ({
  ...assetList(set, get, GIF_MAX_IMAGES),
  options: defaultGifOptions,
  patch: (p) => set((s) => ({ options: { ...s.options, ...p } })),
  progress: null,

  exportGif: async () => {
    const { images, options: o } = get()
    if (!images.length || get().progress !== null) return
    const { width, height } = gifSize(images[0], o)
    const frames = planFrames(images.length, o)
    const bitmaps = images.map((i) => i.bitmap)
    const canvas = createCanvas(width, height)
    const ctx = getCtx(canvas, { willReadFrequently: true })
    set({ progress: 0 })
    try {
      const blob = await encodeGifInWorker(
        width,
        height,
        { colors: o.colors, loop: o.loop },
        frames.length,
        (i) => {
          drawFrame(ctx, bitmaps, frames[i], width, height, o)
          return { rgba: ctx.getImageData(0, 0, width, height).data, delay: frames[i].delay }
        },
        (progress) => set({ progress }),
      )
      const m = getMessages().gif
      saveBlob(blob, `${m.fileName}-${timestamp()}.gif`)
      toast.success(fmt(m.done, { size: formatBytes(blob.size) }))
    } finally {
      set({ progress: null })
    }
  },
}))
