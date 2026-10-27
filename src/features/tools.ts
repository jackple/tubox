import type { ComponentType } from 'react'
import {
  AnnotateGlyph,
  BatchGlyph,
  CutoutGlyph,
  ExifGlyph,
  GifGlyph,
  type GlyphProps,
  GridGlyph,
  IdPhotoGlyph,
  LongImageGlyph,
  NineGridGlyph,
  SocialGlyph,
  VideoGifGlyph,
} from '@/components/icons/ToolGlyphs'

export type ToolGroup = 'process' | 'photo' | 'layout' | 'animation'

export type ToolId = 'batch' | 'cutout' | 'annotate' | 'exif' | 'idphoto' | 'long' | 'grid' | 'nine' | 'social' | 'gif' | 'videogif'

/** 工具注册表；标题、描述、标签等文案见 i18n/messages 的 tools（按 id） */
export interface Tool {
  id: ToolId
  group: ToolGroup
  path: string
  icon: ComponentType<GlyphProps>
  /** 英文短名，用于首页等装饰性排版 */
  en: string
}

export const toolGroups: ToolGroup[] = ['process', 'photo', 'layout', 'animation']

export const tools: Tool[] = [
  { id: 'batch', group: 'process', path: '/batch', icon: BatchGlyph, en: 'Batch' },
  { id: 'cutout', group: 'process', path: '/cutout', icon: CutoutGlyph, en: 'Cutout' },
  { id: 'annotate', group: 'process', path: '/annotate', icon: AnnotateGlyph, en: 'Annotate' },
  { id: 'exif', group: 'process', path: '/exif', icon: ExifGlyph, en: 'EXIF Viewer & Cleaner' },
  { id: 'idphoto', group: 'photo', path: '/id-photo', icon: IdPhotoGlyph, en: 'ID Photo' },
  { id: 'long', group: 'layout', path: '/collage/long', icon: LongImageGlyph, en: 'Long Image' },
  { id: 'grid', group: 'layout', path: '/collage/grid', icon: GridGlyph, en: 'Collage' },
  { id: 'nine', group: 'layout', path: '/collage/nine', icon: NineGridGlyph, en: 'Grid Split' },
  { id: 'social', group: 'layout', path: '/collage/social', icon: SocialGlyph, en: 'Social' },
  { id: 'gif', group: 'animation', path: '/gif', icon: GifGlyph, en: 'GIF Maker' },
  { id: 'videogif', group: 'animation', path: '/video-to-gif', icon: VideoGifGlyph, en: 'Video to GIF' },
]

export const toolById = (id: ToolId) => tools.find((t) => t.id === id)!
