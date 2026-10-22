import type { SVGProps } from 'react'

/**
 * 工具专属图标：24 栅格、1.6 细线、双色（墨色描边 + 品牌色强调块）。
 * 强调色通过 .g-tint / .g-accent 类读取 CSS 变量，自动适配明暗主题。
 */

export type GlyphProps = SVGProps<SVGSVGElement>

const Svg = ({ children, ...p }: GlyphProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...p}
  >
    {children}
  </svg>
)

/** 批量处理：一叠照片 */
export const BatchGlyph = (p: GlyphProps) => (
  <Svg {...p}>
    <path d="M8 4.5h9.5A2.5 2.5 0 0 1 20 7v9.5" />
    <rect className="g-tint" x="4" y="8" width="12.5" height="12" rx="2.5" />
    <rect x="4" y="8" width="12.5" height="12" rx="2.5" />
    <path d="m4.5 18 3.3-3.3a1 1 0 0 1 1.4 0l4.2 4.3" />
    <circle className="g-accent" cx="12.6" cy="11.9" r="1.35" />
  </Svg>
)

/** 证件照：人像卡 */
export const IdPhotoGlyph = (p: GlyphProps) => (
  <Svg {...p}>
    <rect className="g-tint" x="4.5" y="3" width="15" height="18" rx="3" />
    <rect x="4.5" y="3" width="15" height="18" rx="3" />
    <circle className="g-accent" cx="12" cy="10" r="2.7" />
    <path d="M7.6 18.2c.9-2.2 2.4-3.3 4.4-3.3s3.5 1.1 4.4 3.3" />
  </Svg>
)

/** 长图：纵向分段长条 */
export const LongImageGlyph = (p: GlyphProps) => (
  <Svg {...p}>
    <rect className="g-tint" x="6.5" y="9" width="11" height="6" />
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
    <path d="M6.5 9h11M6.5 15h11" />
    <path className="g-accent-stroke" d="M21 10v4" />
  </Svg>
)

/** 自由拼图：不等分网格 */
export const GridGlyph = (p: GlyphProps) => (
  <Svg {...p}>
    <path className="g-tint" d="M6.5 3.5h5v17h-5a3 3 0 0 1-3-3v-11a3 3 0 0 1 3-3z" />
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="M11.5 3.5v17M11.5 12h9" />
    <circle className="g-accent" cx="16" cy="7.75" r="1.25" />
  </Svg>
)

/** 九宫格：中心格高亮 */
export const NineGridGlyph = (p: GlyphProps) => (
  <Svg {...p}>
    <rect className="g-accent" x="9.2" y="9.2" width="5.6" height="5.6" />
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17" />
  </Svg>
)

/** 社交排版：图文卡片 + 闪光 */
export const SocialGlyph = (p: GlyphProps) => (
  <Svg {...p}>
    <rect x="4" y="3" width="13.5" height="18" rx="2.5" />
    <rect className="g-tint" x="6.5" y="5.5" width="8.5" height="6.5" rx="1.2" />
    <path d="M6.5 15h8.5M6.5 18h5" />
    <path className="g-accent-stroke" d="M20.5 2.5v4M18.5 4.5h4" />
  </Svg>
)

/** 首页 */
export const HomeGlyph = (p: GlyphProps) => (
  <Svg {...p}>
    <path className="g-tint" d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />
    <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />
    <path className="g-accent-stroke" d="M9.5 16.5h5" />
  </Svg>
)
