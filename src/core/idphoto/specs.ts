import { linear } from '../scene/paint'
import type { Paint } from '../scene/types'

export type SpecCategory = 'common' | 'cert' | 'visa' | 'exam'

export const specCategories: { id: SpecCategory; name: string }[] = [
  { id: 'common', name: '常用尺寸' },
  { id: 'cert', name: '证件' },
  { id: 'visa', name: '签证' },
  { id: 'exam', name: '考试报名' },
]

export type BgKey = 'white' | 'blue' | 'red' | 'gray' | 'gradient'

export const backgrounds: Record<BgKey, { name: string; paint: Paint; swatch: string }> = {
  white: { name: '白色', paint: '#FFFFFF', swatch: '#FFFFFF' },
  blue: { name: '蓝色', paint: '#438EDB', swatch: '#438EDB' },
  red: { name: '红色', paint: '#FF0000', swatch: '#FF0000' },
  gray: { name: '浅灰', paint: '#EEEEEE', swatch: '#EEEEEE' },
  gradient: { name: '渐变蓝', paint: linear(180, '#2E6CC0', '#A9CBF0'), swatch: 'linear-gradient(180deg,#2E6CC0,#A9CBF0)' },
}

export interface PhotoSpec {
  id: string
  name: string
  category: SpecCategory
  /** 物理尺寸（毫米，宽×高） */
  mm?: [number, number]
  /** 像素尺寸（宽×高） */
  px: [number, number]
  dpi: number
  backgrounds: BgKey[]
  maxKB?: number
  minKB?: number
  /** 头部（头顶到下巴）占照片高度的比例区间 */
  headRatio: [number, number]
  /** 头顶到上边缘占照片高度的比例 */
  topRatio: number
  note?: string
  hot?: boolean
}

const CN: Pick<PhotoSpec, 'dpi' | 'headRatio' | 'topRatio'> = { dpi: 300, headRatio: [0.58, 0.68], topRatio: 0.1 }
const VISA35x45: Pick<PhotoSpec, 'mm' | 'px' | 'dpi'> = { mm: [35, 45], px: [413, 531], dpi: 300 }

export const photoSpecs: PhotoSpec[] = [
  // 常用
  {
    id: 'one-inch',
    name: '一寸',
    category: 'common',
    mm: [25, 35],
    px: [295, 413],
    backgrounds: ['white', 'blue', 'red'],
    hot: true,
    ...CN,
  },
  {
    id: 'two-inch',
    name: '二寸',
    category: 'common',
    mm: [35, 49],
    px: [413, 579],
    backgrounds: ['white', 'blue', 'red'],
    hot: true,
    ...CN,
  },
  { id: 'small-one', name: '小一寸', category: 'common', mm: [22, 32], px: [260, 378], backgrounds: ['white', 'blue', 'red'], ...CN },
  { id: 'big-one', name: '大一寸', category: 'common', mm: [33, 48], px: [390, 567], backgrounds: ['white', 'blue', 'red'], ...CN },
  { id: 'small-two', name: '小二寸', category: 'common', mm: [35, 45], px: [413, 531], backgrounds: ['white', 'blue', 'red'], ...CN },
  {
    id: 'resume',
    name: '简历照',
    category: 'common',
    mm: [25, 35],
    px: [295, 413],
    backgrounds: ['white', 'blue', 'gray', 'gradient'],
    ...CN,
  },

  // 证件
  {
    id: 'idcard',
    name: '身份证',
    category: 'cert',
    mm: [26, 32],
    px: [358, 441],
    backgrounds: ['white'],
    ...CN,
    dpi: 350,
    note: '二代身份证需到派出所现场采集，可用于自助机预约等场景',
  },
  {
    id: 'passport',
    name: '护照 / 港澳通行证',
    category: 'cert',
    mm: [33, 48],
    px: [390, 567],
    backgrounds: ['white'],
    ...CN,
    headRatio: [0.58, 0.69],
    note: '出入境证件照以出入境管理机构要求为准',
  },
  { id: 'driver', name: '驾驶证', category: 'cert', mm: [22, 32], px: [260, 378], backgrounds: ['white'], ...CN },
  {
    id: 'social',
    name: '社保卡',
    category: 'cert',
    mm: [26, 32],
    px: [358, 441],
    backgrounds: ['white'],
    ...CN,
    dpi: 350,
    maxKB: 40,
    minKB: 9,
  },

  // 签证
  {
    id: 'visa-us',
    name: '美国签证',
    category: 'visa',
    mm: [51, 51],
    px: [600, 600],
    dpi: 300,
    backgrounds: ['white'],
    maxKB: 240,
    headRatio: [0.5, 0.69],
    topRatio: 0.12,
    hot: true,
    note: '头部占 50%-69%，眼睛位于距底边 56%-69% 处',
  },
  {
    id: 'visa-schengen',
    name: '申根签证',
    category: 'visa',
    ...VISA35x45,
    backgrounds: ['white', 'gray'],
    headRatio: [0.71, 0.8],
    topRatio: 0.07,
    hot: true,
  },
  {
    id: 'visa-jp',
    name: '日本签证',
    category: 'visa',
    mm: [45, 45],
    px: [531, 531],
    dpi: 300,
    backgrounds: ['white'],
    headRatio: [0.6, 0.72],
    topRatio: 0.1,
  },
  { id: 'visa-kr', name: '韩国签证', category: 'visa', ...VISA35x45, backgrounds: ['white'], headRatio: [0.71, 0.8], topRatio: 0.07 },
  {
    id: 'visa-uk',
    name: '英国签证',
    category: 'visa',
    ...VISA35x45,
    backgrounds: ['gray', 'white'],
    headRatio: [0.64, 0.76],
    topRatio: 0.08,
  },
  { id: 'visa-ca', name: '加拿大签证', category: 'visa', ...VISA35x45, backgrounds: ['white'], headRatio: [0.69, 0.8], topRatio: 0.07 },
  {
    id: 'visa-au',
    name: '澳大利亚签证',
    category: 'visa',
    ...VISA35x45,
    backgrounds: ['white', 'gray'],
    headRatio: [0.71, 0.8],
    topRatio: 0.07,
  },

  // 考试（各年份要求可能调整，务必以报名公告为准）
  { id: 'exam-gk', name: '国家公务员考试', category: 'exam', px: [295, 413], backgrounds: ['white', 'blue'], maxKB: 100, ...CN, hot: true },
  { id: 'exam-teacher', name: '教师资格证', category: 'exam', px: [295, 413], backgrounds: ['white'], maxKB: 200, ...CN },
  { id: 'exam-cet', name: '英语四六级', category: 'exam', px: [144, 192], backgrounds: ['white', 'blue'], maxKB: 50, ...CN },
  {
    id: 'exam-ncre',
    name: '计算机等级考试',
    category: 'exam',
    px: [144, 192],
    backgrounds: ['white', 'blue'],
    minKB: 20,
    maxKB: 200,
    ...CN,
  },
  { id: 'exam-kaoyan', name: '研究生考试', category: 'exam', px: [150, 200], backgrounds: ['white', 'blue'], maxKB: 100, ...CN },
  { id: 'exam-pth', name: '普通话水平测试', category: 'exam', px: [390, 567], backgrounds: ['white', 'blue'], maxKB: 200, ...CN },
]

export const findSpec = (id: string) => photoSpecs.find((s) => s.id === id) ?? photoSpecs[0]

export const specSizeLabel = (s: PhotoSpec) => (s.mm ? `${s.mm[0]}×${s.mm[1]}mm` : `${s.px[0]}×${s.px[1]}px`)
