import { useEffect, useRef } from 'react'
import { renderScene } from '@/core/scene/render'
import type { Scene } from '@/core/scene/types'
import { cn } from '@/lib/cn'

/** 固定宽度的场景缩略图，用于模板 / 版式选择器 */
export function SceneThumb({ scene, width, className }: { scene: Scene; width: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const height = (width * scene.height) / scene.width

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const id = requestAnimationFrame(() => renderScene(scene, { canvas: c, scale: (width * (window.devicePixelRatio || 1)) / scene.width }))
    return () => cancelAnimationFrame(id)
  }, [scene, width])

  return <canvas ref={ref} className={cn('block', className)} style={{ width, height }} />
}
