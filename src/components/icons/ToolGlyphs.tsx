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

/** 人像抠图：虚线选区 + 人像 */
export const CutoutGlyph = (p: GlyphProps) => (
  <Svg {...p}>
    <path className="g-tint" d="M6.5 21c.6-3.4 2.8-5.3 5.5-5.3s4.9 1.9 5.5 5.3z" />
    <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="2.6 2.4" />
    <circle className="g-accent" cx="12" cy="10.2" r="3" />
    <path d="M6.5 21c.6-3.4 2.8-5.3 5.5-5.3s4.9 1.9 5.5 5.3" />
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

/** GIF 动图：胶片帧 + 播放键 */
export const GifGlyph = (p: GlyphProps) => (
  <Svg {...p}>
    <rect className="g-tint" x="7" y="4.5" width="10" height="15" />
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <path d="M7 4.5v15M17 4.5v15M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4" />
    <path className="g-accent" d="M10.6 9.7v4.6l3.6-2.3z" />
  </Svg>
)

/** 视频转 GIF：播放窗口 + 截取片段的时间轴 */
export const VideoGifGlyph = (p: GlyphProps) => (
  <Svg {...p}>
    <rect className="g-tint" x="3" y="3.5" width="18" height="12.5" rx="2.5" />
    <rect x="3" y="3.5" width="18" height="12.5" rx="2.5" />
    <path className="g-accent" d="M10.4 7.1v5.3l4.3-2.65z" />
    <path d="M3.5 20h17" />
    <path className="g-accent-stroke" d="M8 20h8M8 18.2v3.6M16 18.2v3.6" />
  </Svg>
)

/** EXIF 隐私清除：照片 + 盾牌 */
export const ExifGlyph = (p: GlyphProps) => (
  <Svg {...p}>
    <path d="M13 20H6a2.5 2.5 0 0 1-2.5-2.5v-11A2.5 2.5 0 0 1 6 4h11a2.5 2.5 0 0 1 2.5 2.5V11" />
    <path d="m4 16.5 3.6-3.6a1 1 0 0 1 1.4 0l2.5 2.5" />
    <circle className="g-accent" cx="9" cy="8.8" r="1.35" />
    <path className="g-tint" d="M18 13.5l3.5 1.4v2.6c0 2-1.5 3.4-3.5 4-2-.6-3.5-2-3.5-4v-2.6z" />
    <path d="M18 13.5l3.5 1.4v2.6c0 2-1.5 3.4-3.5 4-2-.6-3.5-2-3.5-4v-2.6z" />
  </Svg>
)

/** 图片标注：画框 + 箭头 */
export const AnnotateGlyph = (p: GlyphProps) => (
  <Svg {...p}>
    <rect className="g-tint" x="3.5" y="3.5" width="11" height="9" rx="2" />
    <rect x="3.5" y="3.5" width="11" height="9" rx="2" />
    <path className="g-accent-stroke" d="M20.5 20.5 12 12" />
    <path className="g-accent-stroke" d="M12 16.5V12h4.5" />
    <path d="M4 20.5h5" />
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
