import { type ReactNode, useEffect, useRef } from 'react'
import { renderScene } from '@/core/scene/render'
import type { Scene } from '@/core/scene/types'
import { useElementSize } from '@/hooks/useElementSize'
import { cn } from '@/lib/cn'

interface Props {
  scene: Scene
  /** contain：整体适配；width：按宽度适配并允许纵向滚动（长图） */
  fit?: 'contain' | 'width'
  padding?: number
  className?: string
  /** 叠加层（与画布同尺寸），参数为显示比例 */
  overlay?: (scale: number) => ReactNode
}

/** 预览预算：限制预览画布像素，避免长图在高 DPR 屏上爆内存 */
const PREVIEW_PIXEL_BUDGET = 12_000_000

/** 实时场景预览：按显示尺寸 × DPR 渲染，保证清晰且不浪费算力 */
export function ScenePreview({ scene, fit = 'contain', padding = 40, className, overlay }: Props) {
  const [wrapRef, box] = useElementSize<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const availW = Math.max(0, box.width - padding * 2)
  const availH = Math.max(0, box.height - padding * 2)
  const scale = fit === 'width' ? Math.min(1, availW / scene.width) : Math.min(availW / scene.width, availH / scene.height)
  const cssW = Math.max(1, scene.width * scale)
  const cssH = Math.max(1, scene.height * scale)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !box.width) return
    const raf = requestAnimationFrame(() => {
      const dpr = window.devicePixelRatio || 1
      const budget = Math.sqrt(PREVIEW_PIXEL_BUDGET / (cssW * cssH * dpr * dpr))
      renderScene(scene, { canvas, scale: scale * dpr * Math.min(1, budget) })
    })
    return () => cancelAnimationFrame(raf)
  }, [scene, scale, cssW, cssH, box.width])

  return (
    <div ref={wrapRef} className={cn('absolute inset-0', fit === 'width' ? 'overflow-y-auto' : 'overflow-hidden', className)}>
      <div className={cn('flex min-h-full justify-center', fit === 'contain' && 'items-center')} style={{ padding }}>
        <div className="relative shrink-0" style={{ width: cssW, height: cssH }}>
          <canvas ref={canvasRef} className="block h-full w-full rounded-[3px] shadow-stage" />
          {overlay?.(scale)}
        </div>
      </div>
    </div>
  )
}
