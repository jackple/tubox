import { useRef, useState } from 'react'
import { ChevronsLeftRight } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Props {
  before: string
  after: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
}

/** 前后对比滑块：拖动分割线查看压缩 / 水印效果 */
export function CompareSlider({ before, after, beforeLabel = '原图', afterLabel = '处理后', className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(50)

  const move = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect()
    if (r) setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
  }

  return (
    <div
      ref={ref}
      className={cn('checker relative select-none overflow-hidden', className)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        move(e.clientX)
      }}
      onPointerMove={(e) => e.buttons && move(e.clientX)}
    >
      <img src={after} alt="" className="block h-full w-full object-contain" draggable={false} />
      <img
        src={before}
        alt=""
        className="absolute inset-0 h-full w-full object-contain"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        draggable={false}
      />
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 -ml-px w-0.5 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.15)]" />
        <div className="absolute top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-fg shadow-lift">
          <ChevronsLeftRight className="h-4 w-4 text-neutral-700" />
        </div>
      </div>
      <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-medium text-neutral-900 backdrop-blur">
        {afterLabel}
      </span>
    </div>
  )
}
