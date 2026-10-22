import { useId } from 'react'
import { cn } from '@/lib/cn'

/** 伪「照片」：渐变天空 + 太阳 + 两层山峦，用于首页插画，避免引入真实图片资源 */
export const palettes = {
  dusk: ['#1E1B4B', '#7C3AED', '#F472B6', '#FDBA74', '#312E81', '#4C1D95'],
  ocean: ['#0C4A6E', '#0EA5E9', '#7DD3FC', '#FEF3C7', '#075985', '#0F172A'],
  forest: ['#14532D', '#4ADE80', '#BBF7D0', '#FEF9C3', '#166534', '#052E16'],
  sand: ['#78350F', '#F59E0B', '#FDE68A', '#FFFBEB', '#92400E', '#451A03'],
  mist: ['#334155', '#94A3B8', '#E2E8F0', '#FFFFFF', '#475569', '#1E293B'],
} as const

export type Palette = keyof typeof palettes

export function Scenery({ palette = 'dusk', className, sun = true }: { palette?: Palette; className?: string; sun?: boolean }) {
  const id = useId()
  const [deep, mid, light, glow, hill, ground] = palettes[palette]
  return (
    <svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" className={cn('block h-full w-full', className)} aria-hidden>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={deep} />
          <stop offset="0.55" stopColor={mid} />
          <stop offset="1" stopColor={light} />
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill={`url(#${id}s)`} />
      {sun && <circle cx="82" cy="52" r="15" fill={glow} opacity="0.95" />}
      <path d="M0 78 L24 56 L40 70 L62 44 L86 72 L104 60 L120 70 V120 H0 Z" fill={hill} opacity="0.85" />
      <path d="M0 92 C20 82 40 88 60 84 S100 80 120 88 V120 H0 Z" fill={ground} />
    </svg>
  )
}
