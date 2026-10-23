import { linear } from '../scene/paint'
import type { Paint } from '../scene/types'

export type SpecCategory = 'common' | 'cert' | 'world' | 'visa' | 'exam'

// 规格、分类、背景的显示名按 id 放在 i18n/messages（idphoto.specs / categories / backgrounds）
export const specCategories: SpecCategory[] = ['common', 'cert', 'world', 'visa', 'exam']

export type BgKey = 'white' | 'blue' | 'red' | 'gray' | 'gradient'

export const backgrounds: Record<BgKey, { paint: Paint; swatch: string }> = {
  white: { paint: '#FFFFFF', swatch: '#FFFFFF' },
  blue: { paint: '#438EDB', swatch: '#438EDB' },
  red: { paint: '#FF0000', swatch: '#FF0000' },
  gray: { paint: '#EEEEEE', swatch: '#EEEEEE' },
  gradient: { paint: linear(180, '#2E6CC0', '#A9CBF0'), swatch: 'linear-gradient(180deg,#2E6CC0,#A9CBF0)' },
}

export interface PhotoSpec {
  id: string
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
  /** 内部备注（规格来源 / 注意事项），不在界面显示 */
  note?: string
  hot?: boolean
}

const CN: Pick<PhotoSpec, 'dpi' | 'headRatio' | 'topRatio'> = { dpi: 300, headRatio: [0.58, 0.68], topRatio: 0.1 }
const VISA35x45: Pick<PhotoSpec, 'mm' | 'px' | 'dpi'> = { mm: [35, 45], px: [413, 531], dpi: 300 }
/** ICAO 生物特征护照照片：35×45mm，头部（下巴到头顶）32-36mm */
const ICAO: Pick<PhotoSpec, 'mm' | 'px' | 'dpi' | 'headRatio' | 'topRatio'> = { ...VISA35x45, headRatio: [0.71, 0.8], topRatio: 0.07 }
/** 2×2 英寸（51×51mm），头部 1-1⅜ 英寸 */
const INCH2: Pick<PhotoSpec, 'mm' | 'px' | 'dpi' | 'headRatio' | 'topRatio'> = {
  mm: [51, 51],
  px: [600, 600],
  dpi: 300,
  headRatio: [0.5, 0.69],
  topRatio: 0.12,
}

export const photoSpecs: PhotoSpec[] = [
  // 常用
  {
    id: 'one-inch',
    category: 'common',
    mm: [25, 35],
    px: [295, 413],
    backgrounds: ['white', 'blue', 'red'],
    hot: true,
    ...CN,
  },
  {
    id: 'two-inch',
    category: 'common',
    mm: [35, 49],
    px: [413, 579],
    backgrounds: ['white', 'blue', 'red'],
    hot: true,
    ...CN,
  },
  { id: 'small-one', category: 'common', mm: [22, 32], px: [260, 378], backgrounds: ['white', 'blue', 'red'], ...CN },
  { id: 'big-one', category: 'common', mm: [33, 48], px: [390, 567], backgrounds: ['white', 'blue', 'red'], ...CN },
  { id: 'small-two', category: 'common', mm: [35, 45], px: [413, 531], backgrounds: ['white', 'blue', 'red'], ...CN },
  {
    id: 'resume',
    category: 'common',
    mm: [25, 35],
    px: [295, 413],
    backgrounds: ['white', 'blue', 'gray', 'gradient'],
    ...CN,
  },
  // 巴西、俄罗斯、意大利等地常用的 3×4cm 证件照
  {
    id: 'photo-3x4',
    category: 'common',
    mm: [30, 40],
    px: [354, 472],
    backgrounds: ['white'],
    dpi: 300,
    headRatio: [0.6, 0.72],
    topRatio: 0.09,
  },

  // 证件
  {
    id: 'idcard',
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
    category: 'cert',
    mm: [33, 48],
    px: [390, 567],
    backgrounds: ['white'],
    ...CN,
    headRatio: [0.58, 0.69],
    note: '出入境证件照以出入境管理机构要求为准',
  },
  { id: 'driver', category: 'cert', mm: [22, 32], px: [260, 378], backgrounds: ['white'], ...CN },
  {
    id: 'social',
    category: 'cert',
    mm: [26, 32],
    px: [358, 441],
    backgrounds: ['white'],
    ...CN,
    dpi: 350,
    maxKB: 40,
    minKB: 9,
  },

  // 各国护照（以各国官方要求为准）
  { id: 'passport-us', category: 'world', ...INCH2, backgrounds: ['white'], hot: true, note: '美国护照：2×2 英寸，头部 1-1⅜ 英寸' },
  {
    id: 'passport-uk',
    category: 'world',
    ...ICAO,
    backgrounds: ['gray', 'white'],
    headRatio: [0.64, 0.76],
    topRatio: 0.08,
    note: '浅灰或奶油色背景，头部 29-34mm',
  },
  {
    id: 'passport-eu',
    category: 'world',
    ...ICAO,
    backgrounds: ['white', 'gray'],
    hot: true,
    note: '欧盟各国护照 / 身份证通用 ICAO 生物特征规格',
  },
  {
    id: 'passport-ca',
    category: 'world',
    mm: [50, 70],
    px: [591, 827],
    dpi: 300,
    backgrounds: ['white'],
    headRatio: [0.44, 0.51],
    topRatio: 0.12,
    note: '头部 31-36mm',
  },
  { id: 'passport-au', category: 'world', ...ICAO, backgrounds: ['white', 'gray'] },
  { id: 'passport-in', category: 'world', ...INCH2, backgrounds: ['white'] },
  { id: 'passport-jp', category: 'world', ...ICAO, backgrounds: ['white', 'gray'], topRatio: 0.09, note: '头顶到上边缘 4±2mm' },
  { id: 'passport-kr', category: 'world', ...ICAO, backgrounds: ['white'], topRatio: 0.08 },
  {
    id: 'passport-ru',
    category: 'world',
    ...ICAO,
    backgrounds: ['white'],
    headRatio: [0.69, 0.8],
    note: '俄罗斯国际护照（загранпаспорт）',
  },

  // 签证
  {
    id: 'visa-us',
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
    category: 'visa',
    ...VISA35x45,
    backgrounds: ['white', 'gray'],
    headRatio: [0.71, 0.8],
    topRatio: 0.07,
    hot: true,
  },
  {
    id: 'visa-jp',
    category: 'visa',
    mm: [45, 45],
    px: [531, 531],
    dpi: 300,
    backgrounds: ['white'],
    headRatio: [0.6, 0.72],
    topRatio: 0.1,
  },
  { id: 'visa-kr', category: 'visa', ...VISA35x45, backgrounds: ['white'], headRatio: [0.71, 0.8], topRatio: 0.07 },
  {
    id: 'visa-uk',
    category: 'visa',
    ...VISA35x45,
    backgrounds: ['gray', 'white'],
    headRatio: [0.64, 0.76],
    topRatio: 0.08,
  },
  { id: 'visa-ca', category: 'visa', ...VISA35x45, backgrounds: ['white'], headRatio: [0.69, 0.8], topRatio: 0.07 },
  {
    id: 'visa-au',
    category: 'visa',
    ...VISA35x45,
    backgrounds: ['white', 'gray'],
    headRatio: [0.71, 0.8],
    topRatio: 0.07,
  },

  // 考试（各年份要求可能调整，务必以报名公告为准）
  { id: 'exam-gk', category: 'exam', px: [295, 413], backgrounds: ['white', 'blue'], maxKB: 100, ...CN, hot: true },
  { id: 'exam-teacher', category: 'exam', px: [295, 413], backgrounds: ['white'], maxKB: 200, ...CN },
  { id: 'exam-cet', category: 'exam', px: [144, 192], backgrounds: ['white', 'blue'], maxKB: 50, ...CN },
  {
    id: 'exam-ncre',
    category: 'exam',
    px: [144, 192],
    backgrounds: ['white', 'blue'],
    minKB: 20,
    maxKB: 200,
    ...CN,
  },
  { id: 'exam-kaoyan', category: 'exam', px: [150, 200], backgrounds: ['white', 'blue'], maxKB: 100, ...CN },
  { id: 'exam-pth', category: 'exam', px: [390, 567], backgrounds: ['white', 'blue'], maxKB: 200, ...CN },
]

export const findSpec = (id: string) => photoSpecs.find((s) => s.id === id) ?? photoSpecs[0]

export const specSizeLabel = (s: PhotoSpec) => (s.mm ? `${s.mm[0]}×${s.mm[1]}mm` : `${s.px[0]}×${s.px[1]}px`)
