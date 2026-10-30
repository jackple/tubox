import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  disabled?: boolean
}

interface Props<T extends string> {
  value: T
  options: SegmentedOption<T>[]
  onChange: (v: T) => void
  size?: 'sm' | 'md'
  className?: string
}

/** 分段控件，选中态使用轻量 CSS 淡入 */
export function Segmented<T extends string>({ value, options, onChange, size = 'md', className }: Props<T>) {
  return (
    <div className={cn('relative flex rounded-[10px] bg-fg/[0.05] p-[3px] shadow-[inset_0_1px_2px_rgb(0_0_0/0.04)]', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex-1 whitespace-nowrap rounded-lg font-medium transition-colors disabled:opacity-40',
              size === 'sm' ? 'h-7 px-2 text-[12px]' : 'h-8 px-3 text-[13px]',
              active ? 'text-fg' : 'text-muted hover:text-fg',
            )}
          >
            {active && (
              <span className="segmented-active-in absolute inset-0 rounded-[7px] bg-panel shadow-[var(--highlight),0_1px_3px_rgb(0_0_0/0.12),0_0_0_0.5px_rgb(0_0_0/0.08)] dark:bg-fg/[0.12]" />
            )}
            <span className="relative z-10 inline-flex items-center justify-center gap-1.5">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
