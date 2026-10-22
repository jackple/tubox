import { type CSSProperties, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/cn'

/* ───────── Field ───────── */

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: ReactNode
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || hint) && (
        <div className="flex items-center justify-between">
          {label && <span className="label">{label}</span>}
          {hint && <span className="font-mono text-[11px] tabular-nums text-muted">{hint}</span>}
        </div>
      )}
      {children}
    </div>
  )
}

/* ───────── Slider ───────── */

interface SliderProps {
  label?: ReactNode
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => ReactNode
  className?: string
}

export function Slider({ label, value, min, max, step = 1, onChange, format, className }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <Field label={label} hint={format ? format(value) : value} className={className}>
      <input
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--pct': `${pct}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  )
}

/* ───────── Switch ───────── */

export function Switch({ checked, onChange, className }: { checked: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className={cn(
        'relative inline-flex h-5 w-[34px] shrink-0 items-center rounded-full shadow-[inset_0_1px_2px_rgb(0_0_0/0.12)] transition-colors duration-200',
        checked ? 'bg-brand' : 'bg-fg/15',
        className,
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 34 }}
        className={cn(
          'h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.3),0_0_0_0.5px_rgb(0_0_0/0.06)]',
          checked ? 'ml-4' : 'ml-0.5',
        )}
      />
    </button>
  )
}

/* ───────── Input / Number / Select ───────── */

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('input', className)} {...rest} />
}

export function NumberInput({
  value,
  onChange,
  suffix,
  min,
  max,
  className,
  placeholder,
}: {
  value: number | null
  onChange: (v: number | null) => void
  suffix?: string
  min?: number
  max?: number
  className?: string
  placeholder?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <input
        type="number"
        inputMode="numeric"
        className={cn('input tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none', suffix && 'pr-9')}
        value={value ?? ''}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') return onChange(null)
          const n = Number(raw)
          if (Number.isFinite(n)) onChange(n)
        }}
      />
      {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted">{suffix}</span>}
    </div>
  )
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn('relative', className)}>
      <select className="input cursor-pointer appearance-none pr-8" {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>
  )
}

/* ───────── Section（检查器分组） ───────── */

interface SectionProps {
  title: ReactNode
  icon?: ReactNode
  /** 带开关的分组：关闭时内容折叠 */
  enabled?: boolean
  onToggle?: (v: boolean) => void
  defaultOpen?: boolean
  extra?: ReactNode
  children: ReactNode
}

export function Section({ title, icon, enabled, onToggle, defaultOpen = true, extra, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const toggleable = enabled !== undefined
  const expanded = toggleable ? enabled : open
  return (
    <section className="border-b border-line last:border-b-0">
      <header
        className="group flex h-12 cursor-pointer select-none items-center gap-2.5 px-5"
        onClick={() => (toggleable ? onToggle?.(!enabled) : setOpen(!open))}
      >
        {icon && (
          <span
            className={cn('grid h-4 w-4 place-items-center transition-colors [&>svg]:h-4 [&>svg]:w-4', expanded ? 'text-fg' : 'text-muted')}
          >
            {icon}
          </span>
        )}
        <h3 className={cn('flex-1 text-[13px] font-medium transition-colors', expanded ? 'text-fg' : 'text-muted group-hover:text-fg')}>
          {title}
        </h3>
        {extra}
        {toggleable ? (
          <Switch checked={!!enabled} onChange={(v) => onToggle?.(v)} />
        ) : (
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted transition-transform', !open && '-rotate-90')} />
        )}
      </header>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.3, 0.7, 0.4, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/* ───────── Badge ───────── */

const tones = {
  neutral: 'bg-subtle text-muted',
  brand: 'bg-brand-soft text-brand',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
}

export function Badge({ tone = 'neutral', className, children }: { tone?: keyof typeof tones; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-md px-1.5 font-mono text-[11px] font-medium tabular-nums',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ───────── Chip（可选标签） ───────── */

export function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-7 items-center gap-1 rounded-full border px-3 text-[12px] font-medium transition-all',
        active
          ? 'border-fg bg-fg text-bg shadow-[0_1px_2px_rgb(0_0_0/0.2)]'
          : 'border-line bg-panel text-muted shadow-[0_1px_2px_rgb(0_0_0/0.03)] hover:border-fg/20 hover:text-fg',
        className,
      )}
    >
      {children}
    </button>
  )
}
