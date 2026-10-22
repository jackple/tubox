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

export interface Tool {
  id: string
  group: ToolGroup
  title: string
  desc: string
  path: string
  icon: ComponentType<GlyphProps>
  /** 英文短名，用于首页等装饰性排版 */
  en: string
  chips: string[]
}

export const toolGroups: { id: ToolGroup; title: string; desc: string }[] = [
  { id: 'process', title: '图片处理', desc: '一次处理成百上千张' },
  { id: 'photo', title: '证件与签证', desc: 'AI 抠图 · 智能构图' },
  { id: 'layout', title: '拼图排版', desc: '发圈、种草一步到位' },
]

export const tools: Tool[] = [
  {
    id: 'batch',
    group: 'process',
    title: '批量处理',
    desc: '统一尺寸、压缩体积、添加水印、转换格式，多线程并行处理',
    path: '/batch',
    icon: BatchGlyph,
    en: 'Batch',
    chips: ['统一尺寸', '智能压缩', '水印', 'WebP / AVIF'],
  },
  {
    id: 'idphoto',
    group: 'photo',
    title: '证件照',
    desc: '一寸二寸、签证照、考试报名照，AI 换底与自动构图',
    path: '/id-photo',
    icon: IdPhotoGlyph,
    en: 'ID Photo',
    chips: ['AI 换底', '20+ 规格', '冲印排版', '体积达标'],
  },
  {
    id: 'long',
    group: 'layout',
    title: '长图拼接',
    desc: '聊天记录、电影字幕、横向长图，自动对齐宽度',
    path: '/collage/long',
    icon: LongImageGlyph,
    en: 'Long Image',
    chips: ['竖向 / 横向', '字幕拼接'],
  },
  {
    id: 'grid',
    group: 'layout',
    title: '自由拼图',
    desc: '2-9 张图片，18 种模板，自定义间距圆角与背景',
    path: '/collage/grid',
    icon: GridGlyph,
    en: 'Collage',
    chips: ['18 种模板', '多比例'],
  },
  {
    id: 'nine',
    group: 'layout',
    title: '九宫格切图',
    desc: '一张大图切成朋友圈九宫格，拖拽取景，一键打包',
    path: '/collage/nine',
    icon: NineGridGlyph,
    en: 'Grid Split',
    chips: ['九宫格', '四宫格', '三连图'],
  },
  {
    id: 'social',
    group: 'layout',
    title: '社交排版',
    desc: '小红书封面、朋友圈、公众号头图，模板化图文排版',
    path: '/collage/social',
    icon: SocialGlyph,
    en: 'Social',
    chips: ['小红书', '朋友圈', '公众号'],
  },
]

export const toolById = (id: string) => tools.find((t) => t.id === id)!
