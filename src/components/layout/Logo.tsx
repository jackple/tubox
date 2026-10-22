import { useId } from 'react'
import { cn } from '@/lib/cn'

/**
 * 标志：三块「拼图」组成的方盒，块之间的留白恰好是字母 T（Tubox）。
 * 右下角一块用品牌渐变，象征「被处理的那张图」。
 */
export function LogoMark({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 32 32" className={cn('h-7 w-7 shrink-0', className)} aria-label="Tubox">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--brand))" />
          <stop offset="1" stopColor="rgb(var(--accent))" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="26" height="10.75" rx="3.25" fill="currentColor" />
      <rect x="3" y="16.25" width="11.75" height="12.75" rx="3.25" fill="currentColor" fillOpacity="0.32" />
      <rect x="17.25" y="16.25" width="11.75" height="12.75" rx="3.25" fill={`url(#${id}-g)`} />
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
