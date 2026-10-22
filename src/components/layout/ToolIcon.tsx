import type { ComponentType } from 'react'
import type { GlyphProps } from '@/components/icons/ToolGlyphs'
import { cn } from '@/lib/cn'

const sizes = {
  sm: 'h-7 w-7 rounded-[8px] [&>svg]:h-4 [&>svg]:w-4',
  md: 'h-9 w-9 rounded-[10px] [&>svg]:h-[18px] [&>svg]:w-[18px]',
  lg: 'h-12 w-12 rounded-[14px] [&>svg]:h-6 [&>svg]:w-6',
}

/** 立体小方块图标容器：中性底色 + 顶部高光，图标本身负责双色 */
export function IconTile({
  icon: Icon,
  size = 'md',
  className,
}: {
  icon: ComponentType<GlyphProps>
  size?: keyof typeof sizes
  className?: string
}) {
  return (
    <span className={cn('icon-tile', sizes[size], className)}>
      <Icon />
    </span>
  )
}

export function ToolIcon({
  tool,
  size = 'md',
  className,
}: {
  tool: { icon: ComponentType<GlyphProps> }
  size?: keyof typeof sizes
  className?: string
}) {
  return <IconTile icon={tool.icon} size={size} className={className} />
}
