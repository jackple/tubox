import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

const variants = {
  // 墨色主按钮：顶部高光 + 细描边，暗色模式下自动反转为白底黑字
  primary:
    'bg-fg text-bg bg-[linear-gradient(180deg,rgb(255_255_255/0.14),transparent_60%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_0_0_1px_rgb(var(--fg)),0_2px_6px_-1px_rgb(0_0_0/0.3)] hover:bg-fg/90 active:translate-y-px dark:bg-[linear-gradient(180deg,transparent,rgb(0_0_0/0.06))]',
  brand:
    'bg-brand text-white bg-[linear-gradient(180deg,rgb(255_255_255/0.16),transparent_60%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_0_0_1px_rgb(var(--brand)),0_4px_14px_-4px_rgb(var(--brand)/0.6)] hover:brightness-110 active:translate-y-px',
  secondary:
    'border border-line bg-panel text-fg shadow-[var(--highlight),0_1px_2px_rgb(0_0_0/0.05)] hover:border-fg/20 hover:bg-subtle/60 active:translate-y-px',
  soft: 'bg-fg/[0.06] text-fg hover:bg-fg/10',
  ghost: 'text-muted hover:bg-subtle hover:text-fg',
  danger: 'text-danger hover:bg-danger/10',
}

const sizes = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-[13px]',
  md: 'h-9 gap-2 rounded-[10px] px-4 text-[13px]',
  lg: 'h-11 gap-2 rounded-xl px-5 text-[14px]',
  icon: 'h-8 w-8 rounded-lg',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-medium tracking-[-0.01em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
