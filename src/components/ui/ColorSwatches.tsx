import { Check } from 'lucide-react'
import { useMessages } from '@/i18n'
import { cn } from '@/lib/cn'

export interface Swatch {
  id: string
  css: string
  label?: string
}

interface Props {
  swatches: Swatch[]
  value: string | null
  onChange: (id: string) => void
  /** 允许自定义颜色 */
  custom?: { value: string; onChange: (hex: string) => void; active: boolean }
  size?: 'sm' | 'md'
}

const isLight = (css: string) => /^#(f|e)[\da-f]{5}$/i.test(css) || css === '#ffffff' || css === '#FFFFFF'

export function ColorSwatches({ swatches, value, onChange, custom, size = 'md' }: Props) {
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
  const m = useMessages()
  return (
    <div className="-mx-1.5 flex flex-wrap gap-2.5 p-1.5">
      {swatches.map((s) => {
        const active = s.id === value
        return (
          <button
            key={s.id}
            type="button"
            title={s.label}
            onClick={() => onChange(s.id)}
            className={cn(
              'relative grid place-items-center rounded-full ring-offset-2 ring-offset-panel transition-all hover:scale-105',
              dim,
              active ? 'ring-2 ring-fg' : 'ring-1 ring-line',
            )}
            style={{ background: s.css }}
          >
            {active && <Check className={cn('h-3.5 w-3.5', isLight(s.css) ? 'text-fg' : 'text-white')} strokeWidth={3} />}
          </button>
        )
      })}
      {custom && (
        <label
          title={m.common.customColor}
          className={cn(
            'relative cursor-pointer overflow-hidden rounded-full ring-offset-2 ring-offset-panel transition-all hover:scale-105',
            dim,
            custom.active ? 'ring-2 ring-fg' : 'ring-1 ring-line',
          )}
          style={{
            background: custom.active
              ? custom.value
              : 'conic-gradient(from 0deg, #ff5c5c, #ffc35c, #8cff5c, #5cf0ff, #6b5cff, #ff5ce1, #ff5c5c)',
          }}
        >
          <input
            type="color"
            className="absolute inset-0 cursor-pointer opacity-0"
            value={custom.value}
            onChange={(e) => custom.onChange(e.target.value)}
          />
        </label>
      )}
    </div>
  )
}
