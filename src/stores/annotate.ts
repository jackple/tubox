import { create } from 'zustand'
import { exportAnnotated } from '@/core/annotate/render'
import type { NewShape, Shape, ShapeKind } from '@/core/annotate/types'
import { MIME_EXT, encodeCanvas } from '@/core/encode'
import { getMessages } from '@/i18n'
import { type ImageAsset, disposeAsset, loadAsset } from '@/lib/assets'
import { saveBlob } from '@/lib/download'
import { uid } from '@/lib/format'

export type AnnotateTool = 'select' | ShapeKind

/** 新建图形时使用的样式；选中图形时修改样式会同时作用于该图形 */
export interface AnnotateStyle {
  color: string
  size: number
  fill: boolean
}

/** 撤销步数上限 */
const HISTORY = 100
/** 长截图常见，放宽长边上限，同时受画布面积上限约束 */
const MAX_SIDE = 8192

interface AnnotateState extends AnnotateStyle {
  source: ImageAsset | null
  loading: boolean
  shapes: Shape[]
  past: Shape[][]
  future: Shape[][]
  tool: AnnotateTool
  selectedId: string | null

  load: (file: File) => Promise<void>
  close: () => void
  setTool: (t: AnnotateTool) => void
  setStyle: (p: Partial<AnnotateStyle>) => void
  select: (id: string | null) => void
  /** 以新的图形列表替换当前列表，并记入撤销历史 */
  commit: (shapes: Shape[]) => void
  add: (s: NewShape) => string
  replace: (s: Shape) => void
  removeSelected: () => void
  clearShapes: () => void
  undo: () => void
  redo: () => void
  exportImage: (type: 'image/jpeg' | 'image/png') => Promise<void>
}

export const useAnnotate = create<AnnotateState>((set, get) => ({
  source: null,
  loading: false,
  shapes: [],
  past: [],
  future: [],
  tool: 'arrow',
  selectedId: null,
  color: '#FF3B30',
  size: 4,
  fill: false,

  load: async (file) => {
    set({ loading: true })
    try {
      const source = await loadAsset(file, MAX_SIDE)
      get().source && disposeAsset(get().source!)
      set({ source, shapes: [], past: [], future: [], selectedId: null })
    } finally {
      set({ loading: false })
    }
  },

  close: () => {
    get().source && disposeAsset(get().source!)
    set({ source: null, shapes: [], past: [], future: [], selectedId: null })
  },

  setTool: (tool) => set({ tool, selectedId: tool === 'select' ? get().selectedId : null }),

  setStyle: (p) => {
    set(p)
    const { selectedId, shapes } = get()
    const s = shapes.find((x) => x.id === selectedId)
    if (s) get().replace({ ...s, ...p } as Shape)
  },

  select: (selectedId) => set({ selectedId }),

  commit: (shapes) =>
    set((st) => ({
      shapes,
      past: [...st.past, st.shapes].slice(-HISTORY),
      future: [],
      selectedId: shapes.some((x) => x.id === st.selectedId) ? st.selectedId : null,
    })),

  add: (s) => {
    const id = uid()
    get().commit([...get().shapes, { ...s, id } as Shape])
    return id
  },

  replace: (s) => get().commit(get().shapes.map((x) => (x.id === s.id ? s : x))),

  removeSelected: () => {
    const { selectedId, shapes } = get()
    if (selectedId) get().commit(shapes.filter((x) => x.id !== selectedId))
  },

  clearShapes: () => get().shapes.length && get().commit([]),

  undo: () =>
    set((st) =>
      st.past.length
        ? { shapes: st.past[st.past.length - 1], past: st.past.slice(0, -1), future: [st.shapes, ...st.future], selectedId: null }
        : st,
    ),

  redo: () =>
    set((st) =>
      st.future.length ? { shapes: st.future[0], future: st.future.slice(1), past: [...st.past, st.shapes], selectedId: null } : st,
    ),

  exportImage: async (type) => {
    const { source, shapes } = get()
    if (!source) return
    const { blob } = await encodeCanvas(exportAnnotated(source.bitmap, shapes), type, 0.92)
    const base = source.name.replace(/\.[^.]+$/, '') || 'image'
    saveBlob(blob, `${base}-${getMessages().annotate.fileSuffix}.${MIME_EXT[type]}`)
  },
}))
