import { useId } from 'react'
import { cn } from '@/lib/cn'

/**
 * 标志：圆角方块中镂空出小写 t（Tubox），右上角一个品牌色「像素点」。
 * t 用蒙版真正镂空，放在任何背景上都成立；方块颜色跟随 currentColor。
 */
export function LogoMark({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 48 48" className={cn('h-7 w-7 shrink-0', className)} role="img" aria-label="Tubox">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--brand))" />
          <stop offset="1" stopColor="rgb(var(--accent))" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width="48" height="48" fill="#fff" />
          <path
            d="M20.5 12.5v17.5a6 6 0 0 0 6 6h3.5M14.5 19.5h13"
            fill="none"
            stroke="#000"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </mask>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="12" fill="currentColor" mask={`url(#${id}-m)`} />
      <rect x="31" y="11" width="6" height="6" rx="1.8" fill={`url(#${id}-g)`} />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 text-fg', className)}>
      <LogoMark />
      <div className="flex items-baseline gap-1.5 leading-none">
        <span className="text-[16px] font-semibold tracking-tight">图盒</span>
        <span className="text-[13px] font-medium tracking-tight text-muted">Tubox</span>
      </div>
    </div>
  )
}
