import { type PointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, Loader2, Redo2, Trash2, Undo2, X } from 'lucide-react'
import { Dropzone } from '@/components/common/Dropzone'
import { Button } from '@/components/ui/Button'
import { hitTest, moveShape, shapeBounds } from '@/core/annotate/hit'
import { contrastColor, metrics, renderAnnotations, textLayout, unitOf } from '@/core/annotate/render'
import { type Shape, type TextShape, isBox } from '@/core/annotate/types'
import { useElementSize } from '@/hooks/useElementSize'
import { useMessages } from '@/i18n'
import { ACCEPT, type ImageAsset } from '@/lib/assets'
import { cn } from '@/lib/cn'
import { useAnnotate } from '@/stores/annotate'
import { TOOLS } from './AnnotateInspector'

/** 预览画布像素预算，避免高 DPR 下大图占用过多内存 */
const PIXEL_BUDGET = 12_000_000
const DRAFT_ID = '__draft__'

export function AnnotateStage() {
  const { source, loading, load } = useAnnotate()
  const t = useMessages().annotate
  if (!source)
    return (
      <div className="absolute inset-0 grid place-items-center p-6">
        <Dropzone
          onFiles={(f) => load(f[0])}
          multiple={false}
          className="aspect-[4/3] w-full max-w-[560px]"
          title={t.emptyTitle}
          hint={t.emptyHint}
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted" /> : undefined}
        </Dropzone>
      </div>
    )
  // 换图时重置画布内的临时状态
  return <Editor key={source.id} source={source} />
}

/** 按住 Shift：矩形 / 椭圆约束为正方形 / 正圆，线条约束为 45° 的倍数 */
function constrain(s: Shape, shift: boolean): Shape {
  if (!shift || !isBox(s) || s.kind === 'mosaic') return s
  const dx = s.x2 - s.x1
  const dy = s.y2 - s.y1
  if (s.kind === 'rect' || s.kind === 'ellipse') {
    const d = Math.max(Math.abs(dx), Math.abs(dy))
    return { ...s, x2: s.x1 + Math.sign(dx || 1) * d, y2: s.y1 + Math.sign(dy || 1) * d }
  }
  const len = Math.hypot(dx, dy)
  const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4)
  return { ...s, x2: s.x1 + Math.cos(a) * len, y2: s.y1 + Math.sin(a) * len }
}

/** 图形是否有效（太小的拖拽视为误触） */
function meaningful(s: Shape, minSize: number) {
  if (isBox(s)) return Math.hypot(s.x2 - s.x1, s.y2 - s.y1) >= minSize
  return true
}

interface Editing {
  /** 编辑已有文字时为其 id */
  id: string | null
  x: number
  y: number
  text: string
}

function Editor({ source }: { source: ImageAsset }) {
  const st = useAnnotate()
  const { shapes, tool, color, size, fill, selectedId } = st
  const [boxRef, box] = useElementSize<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<Shape | null>(null)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [hover, setHover] = useState(false)
  const drag = useRef<{ mode: 'draw' | 'move'; x: number; y: number; origin: Shape } | null>(null)
  const t = useMessages().annotate

  const W = source.width
  const H = source.height
  const unit = unitOf(W, H)
  const scale = Math.max(0.01, Math.min((box.width - 48) / W, (box.height - 96) / H, 2))
  const cssW = W * scale
  const cssH = H * scale

  // 拖动中的图形替换 / 追加到列表；正在编辑的文字先隐藏，由输入框代替
  const visible = useMemo(() => {
    let list = shapes
    if (draft) list = list.some((s) => s.id === draft.id) ? list.map((s) => (s.id === draft.id ? draft : s)) : [...list, draft]
    if (editing?.id) list = list.filter((s) => s.id !== editing.id)
    return list
  }, [shapes, draft, editing?.id])

  useEffect(() => {
    const c = canvasRef.current
    if (!c || !box.width) return
    const dpr = window.devicePixelRatio || 1
    const k = scale * dpr * Math.min(1, Math.sqrt(PIXEL_BUDGET / (cssW * cssH * dpr * dpr)))
    const w = Math.max(1, Math.round(W * k))
    const h = Math.max(1, Math.round(H * k))
    if (c.width !== w || c.height !== h) {
      c.width = w
      c.height = h
    }
    const ctx = c.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    renderAnnotations(ctx, source.bitmap, visible, w / W)
  }, [visible, source, scale, cssW, cssH, W, H, box.width])

  const selected = !editing && !drag.current ? shapes.find((s) => s.id === selectedId) : undefined
  const selBox = selected && shapeBounds(selected, unit)

  /* ───── 文字编辑 ───── */

  // 点击画布与输入框失焦可能先后触发提交，用 ref 保证只提交一次
  const editingRef = useRef(editing)
  editingRef.current = editing
  const commitText = () => {
    const editing = editingRef.current
    if (!editing) return
    editingRef.current = null
    const text = editing.text.replace(/\s+$/, '')
    const old = editing.id ? (shapes.find((s) => s.id === editing.id) as TextShape | undefined) : undefined
    if (old) {
      if (!text) st.commit(shapes.filter((s) => s.id !== old.id))
      else if (text !== old.text) st.replace({ ...old, text })
    } else if (text) st.add({ kind: 'text', x: editing.x, y: editing.y, text, color, size, fill })
    setEditing(null)
  }

  const editStyle = (() => {
    if (!editing) return null
    const base = editing.id ? (shapes.find((s) => s.id === editing.id) as TextShape) : null
    const shape: TextShape = { id: '', kind: 'text', x: editing.x, y: editing.y, text: editing.text || ' ', color, size, fill, ...base }
    shape.text = editing.text || ' '
    const l = textLayout(shape, unit)
    return { shape, l }
  })()

  /* ───── 指针交互 ───── */

  const toImage = (e: PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale }
  }
  const tol = 6 / scale

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    // 阻止随后的 mousedown 默认行为（焦点移到 body），否则新建的文字输入框会立刻失焦
    e.preventDefault()
    if (editing) return commitText()
    const p = toImage(e)
    if (tool === 'select' || tool === 'text') {
      const hit = hitTest(shapes, p.x, p.y, unit, tol)
      if (tool === 'text') {
        if (hit?.kind === 'text') setEditing({ id: hit.id, x: hit.x, y: hit.y, text: hit.text })
        else {
          // 点击处作为首行的垂直中心
          const lh = metrics(size, unit).font * 1.3
          setEditing({ id: null, x: p.x, y: p.y - lh / 2 - (fill ? metrics(size, unit).font * 0.4 : 0), text: '' })
        }
        return
      }
      st.select(hit?.id ?? null)
      if (!hit) return
      drag.current = { mode: 'move', x: p.x, y: p.y, origin: hit }
    } else if (tool === 'step') {
      st.add({ kind: 'step', x: p.x, y: p.y, color, size })
      return
    } else {
      const base = { id: DRAFT_ID, color, size }
      const shape: Shape =
        tool === 'pen' || tool === 'marker'
          ? { ...base, kind: tool, points: [p.x, p.y] }
          : { ...base, kind: tool, x1: p.x, y1: p.y, x2: p.x, y2: p.y, fill }
      drag.current = { mode: 'draw', x: p.x, y: p.y, origin: shape }
      setDraft(shape)
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = toImage(e)
    const d = drag.current
    if (!d) {
      if (tool === 'select') setHover(!!hitTest(shapes, p.x, p.y, unit, tol))
      return
    }
    if (d.mode === 'move') return setDraft(moveShape(d.origin, p.x - d.x, p.y - d.y))
    setDraft((cur) => {
      if (!cur) return cur
      if (cur.kind === 'pen' || cur.kind === 'marker') {
        const n = cur.points.length
        if (Math.hypot(p.x - cur.points[n - 2], p.y - cur.points[n - 1]) < 1.5 / scale) return cur
        return { ...cur, points: [...cur.points, p.x, p.y] }
      }
      return isBox(cur) && isBox(d.origin) ? constrain({ ...d.origin, x2: p.x, y2: p.y }, e.shiftKey) : cur
    })
  }

  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (d && draft) {
      if (d.mode === 'move') {
        if (draft !== d.origin) st.replace(draft)
      } else if (meaningful(draft, 4 / scale)) {
        st.add(draft)
      }
    }
    setDraft(null)
  }

  /* ───── 快捷键 ───── */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (editing || el.closest('input, textarea, select, [contenteditable]')) return
      const s = useAnnotate.getState()
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()
      if (mod && key === 'z') {
        e.preventDefault()
        if (e.shiftKey) s.redo()
        else s.undo()
      } else if (mod && key === 'y') {
        e.preventDefault()
        s.redo()
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && s.selectedId) {
        e.preventDefault()
        s.removeSelected()
      } else if (e.key === 'Escape') s.select(null)
      else if (!mod && !e.altKey) {
        const tool = TOOLS.find((x) => x.key.toLowerCase() === key)
        if (tool) s.setTool(tool.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing])

  const cursor = tool === 'select' ? (hover ? 'move' : 'default') : tool === 'text' ? 'text' : 'crosshair'

  return (
    <div className="absolute inset-0 flex flex-col">
      <div ref={boxRef} className="relative grid min-h-0 flex-1 place-items-center overflow-hidden">
        <div
          className="relative touch-none select-none shadow-stage"
          style={{ width: cssW, height: cssH, cursor }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={() => setHover(false)}
          onDoubleClick={(e) => {
            if (tool !== 'select') return
            const r = e.currentTarget.getBoundingClientRect()
            const hit = hitTest(shapes, (e.clientX - r.left) / scale, (e.clientY - r.top) / scale, unit, tol)
            if (hit?.kind === 'text') setEditing({ id: hit.id, x: hit.x, y: hit.y, text: hit.text })
          }}
        >
          <canvas ref={canvasRef} className="block h-full w-full rounded-[3px]" />
          {selBox && (
            <div
              className="pointer-events-none absolute rounded-[3px] border border-dashed border-brand shadow-[0_0_0_1px_rgb(255_255_255/0.6)]"
              style={{
                left: selBox.x * scale - 4,
                top: selBox.y * scale - 4,
                width: selBox.w * scale + 8,
                height: selBox.h * scale + 8,
              }}
            />
          )}
          {editing && editStyle && (
            <textarea
              autoFocus
              value={editing.text}
              placeholder={t.textPlaceholder}
              onChange={(e) => setEditing({ ...editing, text: e.target.value })}
              onBlur={commitText}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setEditing(null)
                else if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  commitText()
                }
              }}
              rows={editing.text.split('\n').length}
              spellCheck={false}
              className={cn(
                'absolute resize-none overflow-hidden whitespace-pre border border-dashed border-brand bg-transparent font-semibold outline-none placeholder:text-current placeholder:opacity-50',
                editStyle.shape.fill && 'rounded-md',
              )}
              style={{
                left: editing.x * scale,
                top: editing.y * scale,
                width: Math.max(editStyle.l.box.w, editStyle.l.font * 4) * scale + 8,
                height: editStyle.l.box.h * scale + 4,
                padding: editStyle.l.pad * scale,
                fontSize: editStyle.l.font * scale,
                lineHeight: 1.3,
                color: editStyle.shape.fill ? contrastColor(editStyle.shape.color) : editStyle.shape.color,
                background: editStyle.shape.fill ? editStyle.shape.color : undefined,
              }}
            />
          )}
        </div>
      </div>

      <div className="flex shrink-0 justify-center pb-5 pt-3">
        <div className="flex items-center gap-1 rounded-2xl border border-line/80 bg-panel/90 p-1.5 shadow-soft backdrop-blur">
          <Button size="icon" variant="ghost" title={`${t.undo} (⌘Z)`} disabled={!st.past.length} onClick={st.undo}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" title={`${t.redo} (⇧⌘Z)`} disabled={!st.future.length} onClick={st.redo}>
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" title={`${t.delete} (Delete)`} disabled={!selectedId} onClick={st.removeSelected}>
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" disabled={!shapes.length} onClick={st.clearShapes}>
            <Trash2 className="h-3.5 w-3.5" /> {t.clearAll}
          </Button>
          <span className="mx-1 h-5 w-px bg-line" />
          <Button size="sm" variant="ghost" onClick={() => fileInput.current?.click()}>
            <ImagePlus className="h-3.5 w-3.5" /> {t.changePhoto}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) st.load(f)
              e.target.value = ''
            }}
          />
        </div>
      </div>
    </div>
  )
}
