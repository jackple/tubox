import { create } from 'zustand'
import { toast } from 'sonner'
import { createCanvas, decodeImage, getCtx } from '@/core/canvas'
import { type CutoutBackground, composeCutout, cutoutRegion } from '@/core/cutout/compose'
import { type CutoutStep, type EdgeOptions, MATTE_SIZE, type Matte, type RawMatte, buildMatte } from '@/core/cutout/matte'
import { MIME_EXT, encodeCanvas } from '@/core/encode'
import { getMessages } from '@/i18n'
import { saveBlob } from '@/lib/download'
import { segmentInWorker } from '@/workers/cutout'

export type CutoutStatus = 'empty' | CutoutStep | 'error'
export type BgMode = CutoutBackground['kind']
export type CutoutFormat = 'image/png' | 'image/webp' | 'image/jpeg'

/** 原图长边上限，控制内存并保证不超出画布安全上限 */
const MAX_SIDE = 4096

interface CutoutState {
  sourceName: string
  source: ImageBitmap | null
  raw: RawMatte | null
  /** 由 raw + 边缘参数派生，参数变化时在 action 中重算 */
  matte: Matte | null
  status: CutoutStatus
  /** 模型下载进度（0-1），仅 model 阶段有意义 */
  progress: number
  error: string | null

  edge: EdgeOptions
  bgMode: BgMode
  bgColor: string
  blur: number
  crop: boolean
  padding: number
  format: CutoutFormat

  setEdge: (p: Partial<EdgeOptions>) => void
  setBgMode: (m: BgMode) => void
  setBgColor: (c: string) => void
  setBlur: (v: number) => void
  setCrop: (v: boolean) => void
  setPadding: (v: number) => void
  setFormat: (f: CutoutFormat) => void
  load: (file: File) => Promise<void>
  close: () => void
  exportImage: () => Promise<void>
}

/** 当前背景设置 */
export function cutoutBackground(s: Pick<CutoutState, 'bgMode' | 'bgColor' | 'blur'>): CutoutBackground {
  if (s.bgMode === 'color') return { kind: 'color', color: s.bgColor }
  if (s.bgMode === 'blur') return { kind: 'blur', blur: s.blur }
  return { kind: 'none' }
}

export const useCutout = create<CutoutState>((set, get) => {
  // 处理中换图时丢弃上一次的结果
  let loadId = 0
  const rebuild = () => {
    const { raw, edge } = get()
    set({ matte: raw ? buildMatte(raw.prob, raw.width, raw.height, edge) : null })
  }

  return {
    sourceName: '',
    source: null,
    raw: null,
    matte: null,
    status: 'empty',
    progress: 0,
    error: null,

    edge: { shift: 0, feather: 0 },
    bgMode: 'none',
    bgColor: '#FFFFFF',
    blur: 40,
    crop: false,
    padding: 0.06,
    format: 'image/png',

    setEdge: (p) => {
      set((s) => ({ edge: { ...s.edge, ...p } }))
      rebuild()
    },
    // JPG 不支持透明，切到透明背景时改用 PNG
    setBgMode: (bgMode) => set((s) => ({ bgMode, format: bgMode === 'none' && s.format === 'image/jpeg' ? 'image/png' : s.format })),
    setBgColor: (bgColor) => set({ bgColor }),
    setBlur: (blur) => set({ blur }),
    setCrop: (crop) => set({ crop }),
    setPadding: (padding) => set({ padding }),
    setFormat: (format) => set({ format }),

    load: async (file) => {
      get().close()
      const id = ++loadId
      const stale = () => id !== loadId
      set({ status: 'model', progress: 0, sourceName: file.name, error: null })
      try {
        let source = await decodeImage(file)
        const s = Math.min(1, MAX_SIDE / Math.max(source.width, source.height))
        if (s < 1) {
          const c = createCanvas(source.width * s, source.height * s)
          getCtx(c).drawImage(source, 0, 0, c.width, c.height)
          source.close()
          source = await createImageBitmap(c)
        }
        if (stale()) return source.close()
        set({ source })

        // 在工作分辨率上推理（模型输入固定 1024），蒙版合成时再放大到原图
        const k = Math.min(1, MATTE_SIZE / Math.max(source.width, source.height))
        const work = createCanvas(source.width * k, source.height * k)
        const wctx = getCtx(work, { willReadFrequently: true })
        wctx.drawImage(source, 0, 0, work.width, work.height)
        const { data } = wctx.getImageData(0, 0, work.width, work.height)
        const raw = await segmentInWorker(data, work.width, work.height, (status, ratio) => {
          if (stale()) return
          set(status === 'model' ? { status, progress: ratio ?? 0 } : { status })
        })
        if (stale()) return
        set({ raw })
        rebuild()
        if (!get().matte?.bounds) {
          const m = getMessages().cutout
          toast.warning(m.noSubject, { description: m.noSubjectDesc })
        }
      } catch (e) {
        if (stale()) return
        get().source?.close()
        set({ source: null, raw: null, matte: null, status: 'error', error: e instanceof Error ? e.message : String(e) })
      }
    },

    close: () => {
      loadId++
      get().source?.close()
      set({ source: null, raw: null, matte: null, status: 'empty', error: null, sourceName: '' })
    },

    exportImage: async () => {
      const st = get()
      const { source, matte } = st
      if (!source || !matte) return
      const region = cutoutRegion(source.width, source.height, matte, st.crop, st.padding)
      const canvas = composeCutout(source, matte.canvas, cutoutBackground(st), region, 1)
      const { blob } = await encodeCanvas(canvas, st.format, 0.92)
      const base = st.sourceName.replace(/\.[^.]+$/, '') || 'image'
      saveBlob(blob, `${base}-${getMessages().cutout.fileSuffix}.${MIME_EXT[st.format]}`)
    },
  }
})
