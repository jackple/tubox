import { useMemo, useRef, useState } from 'react'
import { Crop, Grid3x3, ImagePlus, Move } from 'lucide-react'
import { ScenePreview } from '@/components/common/ScenePreview'
import { Inspector, ToolLayout } from '@/components/layout/ToolLayout'
import { Button } from '@/components/ui/Button'
import { Section, Slider, Switch } from '@/components/ui/controls'
import { Segmented } from '@/components/ui/Segmented'
import { type SliceLayout, buildCropScene, coverOverflow, sliceLayouts, sliceScene } from '@/core/collage/nineGrid'
import { cn } from '@/lib/cn'
import { saveFiles, timestamp } from '@/lib/download'
import { clamp } from '@/lib/format'
import { useNineGrid } from '@/stores/collage'
import { EmptyStage, ExportFooter, extOf } from './shared'

export default function NineGridPage() {
  const { images, add, clear, options: o, patch } = useNineGrid()
  const img = images[0]
  const layout = sliceLayouts.find((l) => l.id === o.layoutId) ?? sliceLayouts[0]
  const [gapPreview, setGapPreview] = useState(true)
  const fileInput = useRef<HTMLInputElement>(null)

  const replace = async (files: File[]) => {
    clear()
    await add(files.slice(0, 1))
    patch({ focus: { x: 0.5, y: 0.5 }, zoom: 1 })
  }

  const scene = useMemo(() => (img ? buildCropScene(img.bitmap, layout, o) : null), [img, layout, o])

  return (
    <ToolLayout
      toolId="nine"
      actions={
        img && (
          <Button variant="ghost" size="sm" onClick={() => fileInput.current?.click()}>
            <ImagePlus className="h-4 w-4" /> 更换图片
          </Button>
        )
      }
      inspector={
        <Inspector
          footer={
            <ExportFooter
              disabled={!scene}
              label={`导出 ${layout.cols * layout.rows} 张切图`}
              note="按 1 → N 的顺序发布即可还原完整画面"
              onExport={async (type) => {
                if (!scene) return
                const blobs = await sliceScene(scene, layout, type, 0.95)
                await saveFiles(
                  blobs.map((blob, i) => ({ blob, name: `${i + 1}.${extOf(type)}` })),
                  `${layout.name}-${timestamp()}.zip`,
                )
              }}
            />
          }
        >
          <Section title="切图方式" icon={<Grid3x3 className="h-3.5 w-3.5" />}>
            <div className="grid grid-cols-5 gap-2">
              {sliceLayouts.map((l) => (
                <LayoutThumb
                  key={l.id}
                  l={l}
                  active={l.id === layout.id}
                  onClick={() => patch({ layoutId: l.id, focus: { x: 0.5, y: 0.5 } })}
                />
              ))}
            </div>
            <label className="flex items-center justify-between text-[13px]">
              朋友圈间隙预览
              <Switch checked={gapPreview} onChange={setGapPreview} />
            </label>
          </Section>
          <Section title="取景" icon={<Crop className="h-3.5 w-3.5" />}>
            <Slider
              label="缩放"
              value={Math.round(o.zoom * 100)}
              min={100}
              max={300}
              onChange={(v) => patch({ zoom: v / 100 })}
              format={(v) => `${v}%`}
            />
            <Slider
              label="水平位置"
              value={Math.round(o.focus.x * 100)}
              min={0}
              max={100}
              onChange={(v) => patch({ focus: { ...o.focus, x: v / 100 } })}
              format={(v) => `${v}%`}
            />
            <Slider
              label="垂直位置"
              value={Math.round(o.focus.y * 100)}
              min={0}
              max={100}
              onChange={(v) => patch({ focus: { ...o.focus, y: v / 100 } })}
              format={(v) => `${v}%`}
            />
            <div className="space-y-1.5">
              <span className="label">单张尺寸</span>
              <Segmented
                size="sm"
                value={String(o.tile)}
                onChange={(v) => patch({ tile: Number(v) })}
                options={[
                  { value: '720', label: '720' },
                  { value: '1080', label: '1080' },
                  { value: '1440', label: '1440' },
                ]}
              />
            </div>
          </Section>
        </Inspector>
      }
    >
      {scene && img ? (
        <ScenePreview
          scene={scene}
          padding={56}
          overlay={(scale) => (
            <PanOverlay layout={layout} scale={scale} gap={gapPreview} img={img.bitmap} sceneW={scene.width} sceneH={scene.height} />
          )}
        />
      ) : (
        <EmptyStage
          onFiles={replace}
          multiple={false}
          title="选择一张图片切成九宫格"
          hint="支持九宫格、四宫格、六宫格与三连图，拖动画面调整取景"
        />
      )}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          replace(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
      />
    </ToolLayout>
  )
}

function PanOverlay({
  layout,
  scale,
  gap,
  img,
  sceneW,
  sceneH,
}: {
  layout: SliceLayout
  scale: number
  gap: boolean
  img: ImageBitmap
  sceneW: number
  sceneH: number
}) {
  const { options: o, patch } = useNineGrid()
  const start = useRef<{ x: number; y: number; fx: number; fy: number } | null>(null)
  const line = gap ? 6 : 1

  return (
    <div
      className="group absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        start.current = { x: e.clientX, y: e.clientY, fx: o.focus.x, fy: o.focus.y }
      }}
      onPointerMove={(e) => {
        const s = start.current
        if (!s) return
        const ov = coverOverflow(img.width, img.height, sceneW, sceneH, o.zoom)
        const fx = ov.x > 0 ? clamp(s.fx - (e.clientX - s.x) / scale / ov.x, 0, 1) : s.fx
        const fy = ov.y > 0 ? clamp(s.fy - (e.clientY - s.y) / scale / ov.y, 0, 1) : s.fy
        patch({ focus: { x: fx, y: fy } })
      }}
      onPointerUp={() => (start.current = null)}
    >
      {Array.from({ length: layout.cols - 1 }, (_, i) => (
        <div
          key={`c${i}`}
          className={cn('absolute inset-y-0 -translate-x-1/2', gap ? 'bg-bg' : 'bg-white/70')}
          style={{ left: `${((i + 1) / layout.cols) * 100}%`, width: line }}
        />
      ))}
      {Array.from({ length: layout.rows - 1 }, (_, i) => (
        <div
          key={`r${i}`}
          className={cn('absolute inset-x-0 -translate-y-1/2', gap ? 'bg-bg' : 'bg-white/70')}
          style={{ top: `${((i + 1) / layout.rows) * 100}%`, height: line }}
        />
      ))}
      <div
        className="pointer-events-none absolute inset-0 grid"
        style={{ gridTemplateColumns: `repeat(${layout.cols}, 1fr)`, gridTemplateRows: `repeat(${layout.rows}, 1fr)` }}
      >
        {Array.from({ length: layout.cols * layout.rows }, (_, i) => (
          <div key={i} className="relative">
            <span className="absolute left-2 top-2 grid h-5 min-w-5 place-items-center rounded-md bg-black/50 px-1 text-[10px] font-bold text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
              {i + 1}
            </span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-[11px] text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
        <Move className="h-3 w-3" /> 拖动调整取景
      </div>
    </div>
  )
}

function LayoutThumb({ l, active, onClick }: { l: SliceLayout; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group flex flex-col items-center gap-1.5">
      <span
        className={cn(
          'grid aspect-square w-full place-items-center rounded-lg border transition',
          active ? 'border-fg bg-fg/[0.03] ring-1 ring-fg' : 'border-line group-hover:border-fg/20',
        )}
      >
        <span className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${l.cols}, 7px)` }}>
          {Array.from({ length: l.cols * l.rows }, (_, i) => (
            <span key={i} className={cn('h-[7px] w-[7px] rounded-[1.5px]', active ? 'bg-fg' : 'bg-muted/40')} />
          ))}
        </span>
      </span>
      <span className={cn('text-[11px] font-medium', active ? 'text-fg' : 'text-muted')}>{l.name}</span>
    </button>
  )
}
