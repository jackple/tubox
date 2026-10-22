import { create } from 'zustand'
import { toast } from 'sonner'
import { ID_PHOTO_WORKING_SIZE } from '@/config'
import { type AnyCanvas, createCanvas, decodeImage, getCtx } from '@/core/canvas'
import { encodeCanvas, withJpegDpi } from '@/core/encode'
import { type AnalyzeStep, type PortraitAnalysis, analyzePortrait } from '@/core/idphoto/analyze'
import { type Adjust, type Framing, autoFrame, composeIdPhoto, cutoutPerson, defaultAdjust } from '@/core/idphoto/compose'
import { buildPrintSheet, papers } from '@/core/idphoto/printSheet'
import { type BgKey, type PhotoSpec, backgrounds, findSpec } from '@/core/idphoto/specs'
import type { Paint } from '@/core/scene/types'
import { saveBlob } from '@/lib/download'

export type IdStatus = 'empty' | AnalyzeStep | 'error'

/** 背景：预设色或自定义 HEX */
export type BgChoice = { kind: 'preset'; key: BgKey } | { kind: 'custom'; color: string }

interface IdPhotoState {
  specId: string
  customPx: [number, number]
  bg: BgChoice
  removeBg: boolean
  maxKB: number | null
  paperId: string
  showGuides: boolean

  sourceName: string
  source: ImageBitmap | null
  analysis: PortraitAnalysis | null
  person: AnyCanvas | null
  framing: Framing | null
  adjust: Adjust
  status: IdStatus
  error: string | null

  spec: () => PhotoSpec
  size: () => [number, number]
  bgPaint: () => Paint | null
  render: () => AnyCanvas | null

  setSpec: (id: string) => void
  setCustomPx: (px: [number, number]) => void
  setBg: (b: BgChoice) => void
  setRemoveBg: (v: boolean) => void
  setMaxKB: (v: number | null) => void
  setPaper: (id: string) => void
  toggleGuides: () => void
  setAdjust: (p: Partial<Adjust>) => void
  resetFraming: () => void
  load: (file: File) => Promise<void>
  close: () => void
  exportSingle: () => Promise<void>
  exportSheet: () => Promise<void>
}

export const CUSTOM_ID = 'custom'

/** 纯函数解析规格；组件里请配合 useMemo 使用，避免选择器每次返回新对象 */
export function resolveSpec(specId: string, customPx: [number, number]): PhotoSpec {
  if (specId !== CUSTOM_ID) return findSpec(specId)
  return {
    id: CUSTOM_ID,
    name: '自定义',
    category: 'common',
    px: customPx,
    dpi: 300,
    backgrounds: ['white', 'blue', 'red'],
    headRatio: [0.58, 0.68],
    topRatio: 0.1,
  }
}

export const useIdPhoto = create<IdPhotoState>((set, get) => {
  const reframe = () => {
    const { analysis } = get()
    if (!analysis) return
    set({ framing: autoFrame(analysis, get().spec(), get().size()), adjust: { ...get().adjust, zoom: 1, dx: 0, dy: 0, rotate: 0 } })
  }

  return {
    specId: 'one-inch',
    customPx: [413, 579],
    bg: { kind: 'preset', key: 'blue' },
    removeBg: true,
    maxKB: null,
    paperId: papers[0].id,
    showGuides: true,

    sourceName: '',
    source: null,
    analysis: null,
    person: null,
    framing: null,
    adjust: defaultAdjust,
    status: 'empty',
    error: null,

    spec: () => resolveSpec(get().specId, get().customPx),
    size: () => get().spec().px,
    bgPaint: () => {
      const { bg, removeBg } = get()
      if (!removeBg) return null
      return bg.kind === 'preset' ? backgrounds[bg.key].paint : bg.color
    },
    render: () => {
      const { source, person, framing, adjust, removeBg } = get()
      if (!source || !framing) return null
      return composeIdPhoto(removeBg && person ? person : source, get().size(), get().bgPaint(), framing, adjust)
    },

    setSpec: (id) => {
      const spec = id === CUSTOM_ID ? null : findSpec(id)
      const bg = get().bg
      // 当前背景不在规格允许范围时，自动切到该规格的首选背景
      const nextBg: BgChoice =
        spec && !(bg.kind === 'preset' && spec.backgrounds.includes(bg.key)) ? { kind: 'preset', key: spec.backgrounds[0] } : bg
      set({ specId: id, bg: nextBg, maxKB: spec?.maxKB ?? null })
      reframe()
    },
    setCustomPx: (px) => {
      set({ customPx: px })
      reframe()
    },
    setBg: (bg) => set({ bg }),
    setRemoveBg: (removeBg) => set({ removeBg }),
    setMaxKB: (maxKB) => set({ maxKB }),
    setPaper: (paperId) => set({ paperId }),
    toggleGuides: () => set((s) => ({ showGuides: !s.showGuides })),
    setAdjust: (p) => set((s) => ({ adjust: { ...s.adjust, ...p } })),
    resetFraming: reframe,

    load: async (file) => {
      get().close()
      set({ status: 'model', sourceName: file.name, error: null })
      try {
        const raw = await decodeImage(file)
        const s = Math.min(1, ID_PHOTO_WORKING_SIZE / Math.max(raw.width, raw.height))
        const c = createCanvas(raw.width * s, raw.height * s)
        getCtx(c).drawImage(raw, 0, 0, c.width, c.height)
        raw.close()
        const source = await createImageBitmap(c)
        set({ source })

        const analysis = await analyzePortrait(source, (status) => set({ status }))
        const person = analysis.mask ? cutoutPerson(source, analysis.mask) : null
        if (!analysis.face) toast.warning('未检测到人脸', { description: '已按默认位置构图，可拖动画面手动调整' })
        if (!person) toast.warning('人像分割不可用', { description: '将保留原始背景' })
        set({ analysis, person, removeBg: !!person, adjust: defaultAdjust })
        reframe()
      } catch (e) {
        set({ status: 'error', error: e instanceof Error ? e.message : String(e) })
      }
    },

    close: () => {
      get().source?.close()
      set({ source: null, analysis: null, person: null, framing: null, status: 'empty', error: null, sourceName: '' })
    },

    exportSingle: async () => {
      const canvas = get().render()
      if (!canvas) return
      const spec = get().spec()
      const { blob } = await encodeCanvas(canvas, 'image/jpeg', 0.95, get().maxKB)
      const out = await withJpegDpi(blob, spec.dpi)
      saveBlob(out, `${spec.name}_${spec.px[0]}x${spec.px[1]}.jpg`)
    },

    exportSheet: async () => {
      const canvas = get().render()
      if (!canvas) return
      const spec = get().spec()
      const paper = papers.find((p) => p.id === get().paperId) ?? papers[0]
      const sheet = buildPrintSheet(canvas, spec, paper)
      if (!sheet.count) return void toast.error('该相纸放不下此规格的照片')
      const { blob } = await encodeCanvas(sheet.canvas, 'image/jpeg', 0.95)
      saveBlob(await withJpegDpi(blob, 300), `${spec.name}_${paper.name.replace(' ', '')}排版_${sheet.count}张.jpg`)
    },
  }
})
