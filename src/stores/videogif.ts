import { create } from 'zustand'
import { toast } from 'sonner'
import { createCanvas, getCtx } from '@/core/canvas'
import { gifSize } from '@/core/gif/frames'
import { DEFAULT_CLIP, MAX_VIDEO_FRAMES, type VideoGifOptions, defaultVideoGifOptions, drawCover, planVideoFrames } from '@/core/gif/video'
import { errorMessage, fmt, getMessages } from '@/i18n'
import { saveBlob } from '@/lib/download'
import { formatBytes } from '@/lib/format'
import { type VideoAsset, closeVideo, disposeVideo, isVideoFile, loadVideo, openVideo, seekVideo } from '@/lib/video'
import { encodeGifInWorker } from '@/workers/gif'

interface VideoGifState {
  video: VideoAsset | null
  /** 正在读取视频元数据 */
  loading: boolean
  options: VideoGifOptions
  patch: (p: Partial<VideoGifOptions>) => void
  /** 取第一个视频文件；成功后替换当前视频并重置片段 */
  load: (files: File[]) => Promise<void>
  close: () => void
  /** 导出进度（0-1），null 表示未在导出 */
  progress: number | null
  exportGif: () => Promise<void>
  cancelExport: () => void
}

export const useVideoGif = create<VideoGifState>((set, get) => {
  let abort: AbortController | null = null

  return {
    video: null,
    loading: false,
    options: defaultVideoGifOptions,
    patch: (p) => set((s) => ({ options: { ...s.options, ...p } })),
    progress: null,

    load: async (files) => {
      const file = files.find(isVideoFile)
      const m = getMessages().videogif
      if (!file) return void toast.error(m.notVideo)
      if (get().progress !== null) return
      set({ loading: true })
      try {
        const video = await loadVideo(file)
        const prev = get().video
        if (prev) disposeVideo(prev)
        set((s) => ({ video, options: { ...s.options, start: 0, end: Math.min(video.duration, DEFAULT_CLIP) } }))
      } catch (e) {
        toast.error(m.loadFailed, { description: errorMessage(e) })
      } finally {
        set({ loading: false })
      }
    },

    close: () => {
      const { video, progress } = get()
      if (progress !== null) return
      if (video) disposeVideo(video)
      set({ video: null })
    },

    exportGif: async () => {
      const { video, options: o } = get()
      if (!video || get().progress !== null) return
      const frames = planVideoFrames(o)
      if (!frames.length || frames.length > MAX_VIDEO_FRAMES) return
      const { width, height } = gifSize(video, o)
      const canvas = createCanvas(width, height)
      const ctx = getCtx(canvas, { willReadFrequently: true })
      ctx.imageSmoothingQuality = 'high'
      const ctrl = (abort = new AbortController())
      set({ progress: 0 })
      // 导出用独立的 video 元素逐帧 seek，不干扰舞台上的预览播放
      let el: HTMLVideoElement | null = null
      try {
        el = await openVideo(video.url)
        const src = el
        const blob = await encodeGifInWorker(
          width,
          height,
          { colors: o.colors, loop: o.loop },
          frames.length,
          async (i) => {
            await seekVideo(src, frames[i].time)
            ctx.fillStyle = '#000'
            ctx.fillRect(0, 0, width, height)
            drawCover(ctx, src, video.width, video.height, width, height)
            return { rgba: ctx.getImageData(0, 0, width, height).data, delay: frames[i].delay }
          },
          (progress) => set({ progress }),
          ctrl.signal,
        )
        const stem = video.name.replace(/\.[^.]+$/, '') || getMessages().gif.fileName
        saveBlob(blob, `${stem}.gif`)
        toast.success(fmt(getMessages().gif.done, { size: formatBytes(blob.size) }))
      } catch (e) {
        if (!ctrl.signal.aborted) throw e
      } finally {
        if (el) closeVideo(el)
        abort = null
        set({ progress: null })
      }
    },

    cancelExport: () => abort?.abort(),
  }
})
