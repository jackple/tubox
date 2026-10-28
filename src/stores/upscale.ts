import { create } from 'zustand'
import { toast } from 'sonner'
import { type AnyCanvas, createCanvas, decodeImage, getCtx, resample } from '@/core/canvas'
import { MIME_EXT, encodeCanvas } from '@/core/encode'
import { type UpscaleBackend, type UpscaleScale, type UpscaleStep, planUpscale } from '@/core/upscale/upscale'
import { fmt, getMessages } from '@/i18n'
import { saveBlob } from '@/lib/download'
import { cancelUpscale, upscaleInWorker } from '@/workers/upscale'

export type UpscaleStatus = 'empty' | 'ready' | UpscaleStep | 'error'
export type UpscaleFormat = 'image/png' | 'image/webp' | 'image/jpeg'

/** 解码时的长边上限，控制内存；实际送入模型的尺寸再由 planUpscale 按输出上限收紧 */
const MAX_SOURCE_SIDE = 4096

export interface UpscaleOutput {
  canvas: AnyCanvas
  scale: UpscaleScale
  backend: UpscaleBackend
}

interface UpscaleState {
  sourceName: string
  source: ImageBitmap | null
  /** 原图含透明像素（导出 JPG 时提示） */
  alpha: boolean
  scale: UpscaleScale
  status: UpscaleStatus
  /** 当前步骤进度（0-1） */
  progress: number
  /** 逐块推理开始的时间，用于估算剩余时间 */
  startedAt: number
  result: UpscaleOutput | null
  error: string | null
  format: UpscaleFormat

  setScale: (s: UpscaleScale) => void
  setFormat: (f: UpscaleFormat) => void
  load: (file: File) => Promise<void>
  run: () => Promise<void>
  cancel: () => void
  close: () => void
  exportImage: () => Promise<void>
}

/** 释放结果画布占用的显存 / 内存 */
const release = (r: UpscaleOutput | null) => {
  if (r) r.canvas.width = r.canvas.height = 0
}

export const useUpscale = create<UpscaleState>((set, get) => {
  // 换图、取消或重新放大时丢弃进行中的结果
  let runId = 0

  return {
    sourceName: '',
    source: null,
    alpha: false,
    scale: 4,
    status: 'empty',
    progress: 0,
    startedAt: 0,
    result: null,
    error: null,
    format: 'image/png',

    setScale: (scale) => set({ scale }),
    setFormat: (format) => set({ format }),

    load: async (file) => {
      get().close()
      const id = ++runId
      set({ sourceName: file.name, status: 'model', progress: 0 })
      try {
        let source = await decodeImage(file)
        const k = Math.min(1, MAX_SOURCE_SIDE / Math.max(source.width, source.height))
        if (k < 1) {
          const c = resample(source, { x: 0, y: 0, w: source.width, h: source.height }, source.width * k, source.height * k)
          source.close()
          source = await createImageBitmap(c)
        }
        if (id !== runId) return source.close()
        const probe = createCanvas(source.width, source.height)
        const ctx = getCtx(probe, { willReadFrequently: true })
        ctx.drawImage(source, 0, 0)
        const { data } = ctx.getImageData(0, 0, probe.width, probe.height)
        let alpha = false
        for (let i = 3; i < data.length; i += 4) if (data[i] < 255) ((alpha = true), (i = data.length))
        set({ source, alpha, format: 'image/png' })
        // 上传后直接开始放大
        await get().run()
      } catch (e) {
        if (id !== runId) return
        set({ status: 'error', error: e instanceof Error ? e.message : String(e) })
      }
    },

    run: async () => {
      const { source, scale } = get()
      if (!source) return
      const id = ++runId
      const stale = () => id !== runId
      const t0 = performance.now()
      set({ status: 'model', progress: 0, error: null })
      try {
        const plan = planUpscale(source.width, source.height, scale)
        const work = plan.limited ? resample(source, { x: 0, y: 0, w: source.width, h: source.height }, plan.w, plan.h) : source
        const c = createCanvas(plan.w, plan.h)
        const ctx = getCtx(c, { willReadFrequently: true })
        ctx.drawImage(work, 0, 0, plan.w, plan.h)
        const { data } = ctx.getImageData(0, 0, plan.w, plan.h)

        const res = await upscaleInWorker(data, plan.w, plan.h, scale, (step, ratio) => {
          if (stale()) return
          if (step === 'upscale' && get().status !== 'upscale') set({ status: step, progress: ratio, startedAt: performance.now() })
          else set({ status: step, progress: ratio })
        })
        if (stale()) return
        const canvas = createCanvas(res.width, res.height)
        getCtx(canvas).putImageData(new ImageData(res.data, res.width, res.height), 0, 0)
        release(get().result)
        set({ result: { canvas, scale, backend: res.backend }, status: 'ready', progress: 1 })
        const m = getMessages().upscale
        toast.success(m.done, {
          description: fmt(m.doneDesc, {
            secs: ((performance.now() - t0) / 1000).toFixed(1),
            backend: res.backend === 'webgpu' ? 'WebGPU' : 'CPU',
          }),
        })
      } catch (e) {
        if (stale()) return
        // 已有结果时保留，仅提示；首次失败进入错误页
        const message = e instanceof Error ? e.message : String(e)
        if (get().result) {
          set({ status: 'ready' })
          toast.error(getMessages().upscale.failed)
        } else set({ status: 'error', error: message })
      }
    },

    cancel: () => {
      runId++
      cancelUpscale()
      set({ status: 'ready', progress: 0 })
    },

    close: () => {
      if (get().status === 'model' || get().status === 'upscale') cancelUpscale()
      runId++
      get().source?.close()
      release(get().result)
      set({ source: null, result: null, status: 'empty', error: null, sourceName: '', progress: 0, alpha: false })
    },

    exportImage: async () => {
      const { result, format, sourceName } = get()
      if (!result) return
      let canvas = result.canvas
      if (format === 'image/jpeg' && get().alpha) {
        // JPG 不支持透明，铺白底
        canvas = createCanvas(result.canvas.width, result.canvas.height)
        const ctx = getCtx(canvas)
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(result.canvas, 0, 0)
      }
      const { blob } = await encodeCanvas(canvas, format, 0.92)
      const base = sourceName.replace(/\.[^.]+$/, '') || 'image'
      saveBlob(blob, `${base}-${getMessages().upscale.fileSuffix}-${result.scale}x.${MIME_EXT[format]}`)
    },
  }
})
