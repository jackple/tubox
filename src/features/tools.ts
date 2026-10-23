import type { ComponentType } from 'react'
import {
  BatchGlyph,
  type GlyphProps,
  GridGlyph,
  IdPhotoGlyph,
  LongImageGlyph,
  NineGridGlyph,
  SocialGlyph,
} from '@/components/icons/ToolGlyphs'

export type ToolGroup = 'process' | 'photo' | 'layout'

export type ToolId = 'batch' | 'idphoto' | 'long' | 'grid' | 'nine' | 'social'

/** 工具注册表；标题、描述、标签等文案见 i18n/messages 的 tools（按 id） */
export interface Tool {
  id: ToolId
  group: ToolGroup
  path: string
  icon: ComponentType<GlyphProps>
  /** 英文短名，用于首页等装饰性排版 */
  en: string
}

export const toolGroups: ToolGroup[] = ['process', 'photo', 'layout']

export const tools: Tool[] = [
  { id: 'batch', group: 'process', path: '/batch', icon: BatchGlyph, en: 'Batch' },
  { id: 'idphoto', group: 'photo', path: '/id-photo', icon: IdPhotoGlyph, en: 'ID Photo' },
  { id: 'long', group: 'layout', path: '/collage/long', icon: LongImageGlyph, en: 'Long Image' },
  { id: 'grid', group: 'layout', path: '/collage/grid', icon: GridGlyph, en: 'Collage' },
  { id: 'nine', group: 'layout', path: '/collage/nine', icon: NineGridGlyph, en: 'Grid Split' },
  { id: 'social', group: 'layout', path: '/collage/social', icon: SocialGlyph, en: 'Social' },
]

export const toolById = (id: ToolId) => tools.find((t) => t.id === id)!
