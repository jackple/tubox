import type { Drawable } from '../canvas'
import { type FontKind, fontOf } from '../fonts'
import { linear } from '../scene/paint'
import type { Layer, LinearGradient, Paint, Scene, TextLayer } from '../scene/types'
import { gridTemplates, layoutCells } from './templates'

/* ───────────────────────── 画布规格 ───────────────────────── */

export interface SocialPreset {
  id: string
  name: string
  hint: string
  width: number
  height: number
}

export const socialPresets: SocialPreset[] = [
  { id: 'xhs', name: '小红书', hint: '3:4', width: 1242, height: 1656 },
  { id: 'moments', name: '朋友圈', hint: '1:1', width: 1080, height: 1080 },
  { id: 'story', name: '视频号', hint: '9:16', width: 1080, height: 1920 },
  { id: 'weibo', name: '微博横图', hint: '16:9', width: 1920, height: 1080 },
  { id: 'mp', name: '公众号封面', hint: '2.35:1', width: 900, height: 383 },
]

/* ───────────────────────── 主题配色 ───────────────────────── */

export interface SocialTheme {
  id: string
  name: string
  bg: Paint
  surface: string
  fg: string
  muted: string
  accent: string
  accentFg: string
}

export const socialThemes: SocialTheme[] = [
  {
    id: 'cream',
    name: '奶油',
    bg: linear(160, '#FBF6EE', '#F1E4D2'),
    surface: '#FFFDF8',
    fg: '#2B2118',
    muted: '#8C7B6B',
    accent: '#E07A3F',
    accentFg: '#FFFFFF',
  },
  {
    id: 'midnight',
    name: '夜幕',
    bg: linear(160, '#141428', '#2C2155'),
    surface: '#1F1B3D',
    fg: '#F4F1FF',
    muted: '#A9A3CC',
    accent: '#8B7CFF',
    accentFg: '#FFFFFF',
  },
  {
    id: 'mint',
    name: '薄荷',
    bg: linear(160, '#EAF7F1', '#CDEDE0'),
    surface: '#FFFFFF',
    fg: '#113328',
    muted: '#5D8577',
    accent: '#1FA37A',
    accentFg: '#FFFFFF',
  },
  {
    id: 'sunset',
    name: '落日',
    bg: linear(150, '#FFB88C', '#FF6F91', '#9A5CF5'),
    surface: '#FFF8F5',
    fg: '#2A1530',
    muted: '#8A6A80',
    accent: '#FF4D6D',
    accentFg: '#FFFFFF',
  },
  {
    id: 'sakura',
    name: '樱花',
    bg: linear(160, '#FFF1F5', '#FFD9E4'),
    surface: '#FFFFFF',
    fg: '#3A1D27',
    muted: '#A07A88',
    accent: '#F0628C',
    accentFg: '#FFFFFF',
  },
  { id: 'mono', name: '极简', bg: '#F4F4F2', surface: '#FFFFFF', fg: '#111111', muted: '#77736E', accent: '#111111', accentFg: '#FFFFFF' },
]

/* ───────────────────────── 版式 ───────────────────────── */

export interface SocialContent {
  title: string
  subtitle: string
  tag: string
  footer: string
}

export interface SocialBuildContext {
  images: Drawable[]
  W: number
  H: number
  content: SocialContent
  theme: SocialTheme
  font: FontKind
}

export interface SocialStyle {
  id: string
  name: string
  desc: string
  /** 需要的图片数量区间 */
  images: [number, number]
  build: (c: SocialBuildContext) => Scene
}

const fade = (angle: number, ...stops: [number, string][]): LinearGradient => ({ type: 'linear', angle, stops })

/** 粗略估算文字行数，用于自下而上排版（中文按 1em，西文按 0.56em） */
function estimateLines(text: string, size: number, maxWidth: number, maxLines: number) {
  if (!text) return 0
  let lines = 0
  for (const para of text.split('\n')) {
    let w = 0
    for (const ch of para) w += /[⺀-鿿＀-￯]/.test(ch) ? size : size * 0.56
    lines += Math.max(1, Math.ceil(w / maxWidth))
  }
  return Math.min(lines, maxLines)
}

function tagLayer(text: string, x: number, y: number, size: number, theme: SocialTheme, align: TextLayer['align'] = 'left'): TextLayer {
  const padX = size * 0.8
  return {
    type: 'text',
    text,
    x: align === 'left' ? x + padX : x,
    y,
    size,
    weight: 600,
    color: theme.accentFg,
    align,
    valign: 'top',
    lineHeight: 1.2,
    pill: { fill: theme.accent, padX, padY: size * 0.45, radius: size },
  }
}

const metrics = (W: number, H: number) => {
  const u = Math.min(W, H) / 100
  return { u, pad: u * 7, landscape: W / H > 1.25 }
}

/** 大字封面：满版图片 + 底部渐变 + 大标题 */
const cover: SocialStyle = {
  id: 'cover',
  name: '大字封面',
  desc: '满版图 · 底部大标题',
  images: [0, 1],
  build: ({ images, W, H, content, theme, font }) => {
    const { u, pad, landscape } = metrics(W, H)
    const img = images[0]
    const family = fontOf(font)
    const fg = img ? '#FFFFFF' : theme.fg
    const layers: Layer[] = []

    if (img) {
      layers.push({ type: 'image', image: img, x: 0, y: 0, w: W, h: H, fit: 'cover' })
      layers.push({
        type: 'rect',
        x: 0,
        y: 0,
        w: W,
        h: H,
        fill: fade(180, [0, 'rgba(0,0,0,0.25)'], [0.35, 'rgba(0,0,0,0)'], [0.55, 'rgba(0,0,0,0.08)'], [1, 'rgba(0,0,0,0.72)']),
      })
    } else {
      layers.push({ type: 'rect', x: W * 0.55, y: -H * 0.1, w: W * 0.7, h: W * 0.7, radius: W, fill: theme.accent, opacity: 0.16 })
      layers.push({ type: 'rect', x: -W * 0.2, y: H * 0.55, w: W * 0.5, h: W * 0.5, radius: W, fill: theme.accent, opacity: 0.1 })
    }

    const maxWidth = W - pad * 2
    const titleSize = landscape ? u * 11 : u * 9.5
    const subSize = u * 3.6
    const subLines = estimateLines(content.subtitle, subSize, maxWidth, 2)
    const subBlock = subLines ? subLines * subSize * 1.45 + u * 3 : 0

    if (content.tag) layers.push(tagLayer(content.tag, pad, pad, u * 3.2, theme))
    if (content.footer)
      layers.push({
        type: 'text',
        text: content.footer,
        x: W - pad,
        y: pad + u * 0.6,
        size: u * 3,
        color: fg,
        opacity: 0.85,
        align: 'right',
        valign: 'top',
        weight: 500,
      })

    layers.push({
      type: 'text',
      text: content.title,
      x: pad,
      y: H - pad - subBlock,
      size: titleSize,
      weight: 800,
      family,
      color: fg,
      maxWidth,
      maxLines: 3,
      lineHeight: 1.16,
      valign: 'bottom',
      shadow: img ? { color: 'rgba(0,0,0,0.25)', blur: u * 2, y: u * 0.4 } : undefined,
    })
    if (content.subtitle)
      layers.push({
        type: 'text',
        text: content.subtitle,
        x: pad,
        y: H - pad,
        size: subSize,
        color: fg,
        opacity: 0.88,
        maxWidth,
        maxLines: 2,
        lineHeight: 1.45,
        valign: 'bottom',
        family,
      })

    return { width: W, height: H, background: theme.bg, layers }
  },
}

/** 拍立得：倾斜的相纸卡片 + 手写感标题 */
const polaroid: SocialStyle = {
  id: 'polaroid',
  name: '拍立得',
  desc: '相纸卡片 · 复古温柔',
  images: [1, 1],
  build: ({ images, W, H, content, theme, font }) => {
    const { u, pad, landscape } = metrics(W, H)
    const img = images[0]
    const family = fontOf(font)
    const cardW = landscape ? H * 0.74 : W * 0.74
    const m = cardW * 0.06
    const photo = cardW - m * 2
    const photoH = photo * (landscape ? 0.82 : 1)
    const cardH = m + photoH + cardW * 0.22
    const cx = landscape ? W * 0.32 : W / 2
    const cy = landscape ? H / 2 : H * 0.45
    const x = cx - cardW / 2
    const y = cy - cardH / 2
    const origin = { x: cx, y: cy }
    const rotate = -3

    const layers: Layer[] = [
      { type: 'rect', x: W * 0.62, y: H * 0.05, w: u * 26, h: u * 26, radius: u * 13, fill: theme.accent, opacity: 0.14 },
      {
        type: 'rect',
        x,
        y,
        w: cardW,
        h: cardH,
        radius: u * 0.8,
        fill: '#FFFFFF',
        rotate,
        origin,
        shadow: { color: 'rgba(40,20,10,0.22)', blur: u * 5, y: u * 1.6 },
      },
    ]
    if (img) layers.push({ type: 'image', image: img, x: x + m, y: y + m, w: photo, h: photoH, fit: 'cover', rotate, origin })
    layers.push({
      type: 'text',
      text: content.title,
      x: cx,
      y: y + m + photoH + (cardH - m - photoH) / 2,
      size: cardW * 0.068,
      color: '#2E2A27',
      family,
      weight: 600,
      align: 'center',
      valign: 'middle',
      maxWidth: photo,
      maxLines: 1,
      rotate,
      origin,
    })

    if (landscape) {
      const tx = W * 0.62
      const maxWidth = W - tx - pad
      if (content.tag) layers.push(tagLayer(content.tag, tx, H * 0.26, u * 3.4, theme))
      layers.push({
        type: 'text',
        text: content.subtitle,
        x: tx,
        y: H * 0.42,
        size: u * 5,
        color: theme.fg,
        weight: 700,
        family,
        maxWidth,
        maxLines: 3,
        lineHeight: 1.35,
        valign: 'top',
      })
      if (content.footer)
        layers.push({ type: 'text', text: content.footer, x: tx, y: H - pad, size: u * 3, color: theme.muted, valign: 'bottom' })
    } else {
      if (content.tag) layers.push(tagLayer(content.tag, W / 2, pad * 0.8, u * 3.2, theme, 'center'))
      layers.push({
        type: 'text',
        text: content.subtitle,
        x: W / 2,
        y: y + cardH + u * 7,
        size: u * 4.2,
        color: theme.fg,
        weight: 600,
        family,
        align: 'center',
        maxWidth: W - pad * 2,
        maxLines: 2,
        lineHeight: 1.45,
        valign: 'top',
      })
      if (content.footer)
        layers.push({
          type: 'text',
          text: content.footer,
          x: W / 2,
          y: H - pad * 0.7,
          size: u * 2.8,
          color: theme.muted,
          align: 'center',
          valign: 'bottom',
          letterSpacing: u * 0.3,
        })
    }
    return { width: W, height: H, background: theme.bg, layers }
  },
}

/** 杂志风：刊头大字 + 封面标题 */
const magazine: SocialStyle = {
  id: 'magazine',
  name: '杂志封面',
  desc: '刊头大字 · 时尚感',
  images: [1, 1],
  build: ({ images, W, H, content, theme, font }) => {
    const { u, pad, landscape } = metrics(W, H)
    const img = images[0]
    const serif = fontOf('serif')
    const family = fontOf(font)
    const maxWidth = W - pad * 2
    const mastSize = landscape ? H * 0.2 : W * 0.17
    const layers: Layer[] = []
    if (img) layers.push({ type: 'image', image: img, x: 0, y: 0, w: W, h: H, fit: 'cover' })
    layers.push({
      type: 'rect',
      x: 0,
      y: 0,
      w: W,
      h: H,
      fill: fade(180, [0, 'rgba(0,0,0,0.5)'], [0.32, 'rgba(0,0,0,0)'], [0.6, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.6)']),
    })

    layers.push({
      type: 'text',
      text: (content.tag || 'TUBOX').toUpperCase(),
      x: W / 2,
      y: pad * 0.7,
      size: mastSize,
      weight: 700,
      family: serif,
      color: '#FFFFFF',
      align: 'center',
      valign: 'top',
      letterSpacing: mastSize * 0.06,
      maxWidth: W - pad,
      maxLines: 1,
      lineHeight: 1,
    })
    layers.push({
      type: 'text',
      text: content.footer || `VOL.${new Date().getMonth() + 1} · ${new Date().getFullYear()}`,
      x: W / 2,
      y: pad * 0.7 + mastSize * 1.08,
      size: u * 2.4,
      color: '#FFFFFF',
      opacity: 0.85,
      align: 'center',
      valign: 'top',
      letterSpacing: u * 0.8,
      weight: 500,
    })

    const subSize = u * 3.3
    const subLines = estimateLines(content.subtitle, subSize, maxWidth * 0.8, 2)
    const subBlock = subLines ? subLines * subSize * 1.45 + u * 2.4 : 0
    const titleSize = landscape ? u * 8 : u * 7.6
    const titleLines = estimateLines(content.title, titleSize, maxWidth * 0.86, 3)
    const titleTop = H - pad - subBlock - titleLines * titleSize * 1.18
    layers.push({ type: 'rect', x: pad, y: titleTop - u * 3.6, w: u * 9, h: u * 0.8, fill: theme.accent })
    layers.push({
      type: 'text',
      text: content.title,
      x: pad,
      y: H - pad - subBlock,
      size: titleSize,
      weight: 800,
      family,
      color: '#FFFFFF',
      maxWidth: maxWidth * 0.86,
      maxLines: 3,
      lineHeight: 1.18,
      valign: 'bottom',
    })
    if (content.subtitle)
      layers.push({
        type: 'text',
        text: content.subtitle,
        x: pad,
        y: H - pad,
        size: subSize,
        color: '#FFFFFF',
        opacity: 0.85,
        maxWidth: maxWidth * 0.8,
        maxLines: 2,
        lineHeight: 1.45,
        valign: 'bottom',
        family,
      })
    return { width: W, height: H, background: img ? '#000000' : theme.bg, layers }
  },
}

/** 留白卡片：模糊背景 + 白色卡片 */
const card: SocialStyle = {
  id: 'card',
  name: '留白卡片',
  desc: '模糊底 · 精致卡片',
  images: [1, 1],
  build: ({ images, W, H, content, theme, font }) => {
    const { u, pad, landscape } = metrics(W, H)
    const img = images[0]
    const family = fontOf(font)
    const layers: Layer[] = []
    if (img) {
      layers.push({ type: 'image', image: img, x: -W * 0.1, y: -H * 0.1, w: W * 1.2, h: H * 1.2, fit: 'cover', blur: u * 5 })
      layers.push({ type: 'rect', x: 0, y: 0, w: W, h: H, fill: theme.surface, opacity: 0.28 })
    }
    const cx = pad * 0.9
    const cy = landscape ? pad * 0.9 : pad * 1.3
    const cw = W - cx * 2
    const ch = H - cy * 2
    const m = u * 3.4
    layers.push({
      type: 'rect',
      x: cx,
      y: cy,
      w: cw,
      h: ch,
      radius: u * 4,
      fill: theme.surface,
      shadow: { color: 'rgba(15,15,35,0.22)', blur: u * 6, y: u * 2 },
    })

    if (landscape) {
      const iw = cw * 0.52
      if (img) layers.push({ type: 'image', image: img, x: cx + m, y: cy + m, w: iw - m, h: ch - m * 2, fit: 'cover', radius: u * 2.6 })
      const tx = cx + iw + m * 1.2
      const tw = cw - iw - m * 2.4
      if (content.tag)
        layers.push({
          type: 'text',
          text: `● ${content.tag}`,
          x: tx,
          y: cy + m * 1.6,
          size: u * 3.2,
          color: theme.accent,
          weight: 600,
          valign: 'top',
        })
      layers.push({
        type: 'text',
        text: content.title,
        x: tx,
        y: cy + ch / 2,
        size: u * 6.6,
        weight: 800,
        family,
        color: theme.fg,
        maxWidth: tw,
        maxLines: 3,
        lineHeight: 1.25,
        valign: 'bottom',
      })
      layers.push({
        type: 'text',
        text: content.subtitle,
        x: tx,
        y: cy + ch / 2 + u * 3,
        size: u * 3.4,
        family,
        color: theme.muted,
        maxWidth: tw,
        maxLines: 3,
        lineHeight: 1.5,
        valign: 'top',
      })
      if (content.footer)
        layers.push({
          type: 'text',
          text: content.footer,
          x: tx,
          y: cy + ch - m * 1.4,
          size: u * 2.8,
          color: theme.muted,
          valign: 'bottom',
        })
    } else {
      const ih = ch * 0.64
      if (img) layers.push({ type: 'image', image: img, x: cx + m, y: cy + m, w: cw - m * 2, h: ih, fit: 'cover', radius: u * 2.6 })
      const tx = cx + m * 1.4
      const tw = cw - m * 2.8
      let ty = cy + m + ih + u * 5
      if (content.tag) {
        layers.push({ type: 'text', text: `● ${content.tag}`, x: tx, y: ty, size: u * 3, color: theme.accent, weight: 600, valign: 'top' })
        ty += u * 6
      }
      layers.push({
        type: 'text',
        text: content.title,
        x: tx,
        y: ty,
        size: u * 6,
        weight: 800,
        family,
        color: theme.fg,
        maxWidth: tw,
        maxLines: 2,
        lineHeight: 1.25,
        valign: 'top',
      })
      ty += estimateLines(content.title, u * 6, tw, 2) * u * 7.5 + u * 2
      layers.push({
        type: 'text',
        text: content.subtitle,
        x: tx,
        y: ty,
        size: u * 3.3,
        family,
        color: theme.muted,
        maxWidth: tw,
        maxLines: 2,
        lineHeight: 1.5,
        valign: 'top',
      })
      if (content.footer)
        layers.push({
          type: 'text',
          text: content.footer,
          x: cx + cw - m * 1.4,
          y: cy + ch - m * 1.2,
          size: u * 2.8,
          color: theme.muted,
          align: 'right',
          valign: 'bottom',
        })
    }
    return { width: W, height: H, background: theme.bg, layers }
  },
}

/** 多图拼贴：标题区 + 自适应网格 */
const mosaic: SocialStyle = {
  id: 'mosaic',
  name: '多图拼贴',
  desc: '1-4 张 · 图文合集',
  images: [1, 4],
  build: ({ images, W, H, content, theme, font }) => {
    const { u, pad, landscape } = metrics(W, H)
    const family = fontOf(font)
    const n = Math.max(1, Math.min(4, images.length))
    const tpl =
      n === 1
        ? null
        : gridTemplates.find(
            (t) => t.id === (n === 2 ? (landscape ? '2-h' : '2-v') : n === 3 ? (landscape ? '3-l1r2' : '3-t1b2') : '4-grid'),
          )!
    const layers: Layer[] = []

    const area = landscape
      ? { x: W * 0.38, y: pad * 0.8, w: W * 0.62 - pad * 0.8, h: H - pad * 1.6 }
      : { x: pad * 0.8, y: H * 0.27, w: W - pad * 1.6, h: H * 0.73 - pad * 0.8 }
    const cells = tpl ? layoutCells(tpl.cells, area.w, area.h, 0, u * 1.6) : [{ x: 0, y: 0, w: area.w, h: area.h }]
    cells.forEach((c, i) => {
      const image = images[i]
      const box = { x: area.x + c.x, y: area.y + c.y, w: c.w, h: c.h, radius: u * 2.4 }
      layers.push(image ? { type: 'image', image, fit: 'cover', ...box } : { type: 'rect', fill: 'rgba(128,128,160,0.15)', ...box })
    })

    const tx = landscape ? pad : pad * 0.9
    const tw = landscape ? W * 0.38 - pad * 1.6 : W - pad * 1.8
    let ty = landscape ? H * 0.2 : pad * 0.9
    if (content.tag) {
      layers.push(tagLayer(content.tag, tx, ty, u * 3, theme))
      ty += u * 7
    }
    const titleSize = landscape ? u * 6.4 : u * 7
    layers.push({
      type: 'text',
      text: content.title,
      x: tx,
      y: ty,
      size: titleSize,
      weight: 800,
      family,
      color: theme.fg,
      maxWidth: tw,
      maxLines: landscape ? 4 : 2,
      lineHeight: 1.2,
      valign: 'top',
    })
    ty += estimateLines(content.title, titleSize, tw, landscape ? 4 : 2) * titleSize * 1.2 + u * 2
    layers.push({
      type: 'text',
      text: content.subtitle,
      x: tx,
      y: ty,
      size: u * 3.2,
      family,
      color: theme.muted,
      maxWidth: tw,
      maxLines: landscape ? 4 : 1,
      lineHeight: 1.5,
      valign: 'top',
    })
    if (content.footer && landscape)
      layers.push({ type: 'text', text: content.footer, x: tx, y: H - pad, size: u * 2.8, color: theme.muted, valign: 'bottom' })
    return { width: W, height: H, background: theme.bg, layers }
  },
}

/** 文字卡：无需图片，适合金句、干货 */
const quote: SocialStyle = {
  id: 'quote',
  name: '文字卡片',
  desc: '无需图片 · 金句干货',
  images: [0, 0],
  build: ({ W, H, content, theme, font }) => {
    const { u, pad, landscape } = metrics(W, H)
    const family = fontOf(font)
    const maxWidth = W - pad * 2
    const titleSize = landscape ? u * 7 : u * 7.4
    const layers: Layer[] = [
      { type: 'rect', x: W - u * 46, y: -u * 16, w: u * 62, h: u * 62, radius: u * 31, fill: theme.accent, opacity: 0.12 },
      { type: 'rect', x: -u * 14, y: H - u * 30, w: u * 40, h: u * 40, radius: u * 20, fill: theme.accent, opacity: 0.08 },
      {
        type: 'text',
        text: '“',
        x: pad - u * 1.5,
        y: pad * (landscape ? 0.2 : 0.9),
        size: u * 30,
        color: theme.accent,
        family: fontOf('serif'),
        weight: 700,
        valign: 'top',
        lineHeight: 1,
      },
    ]
    const titleY = landscape ? H * 0.34 : H * 0.32
    layers.push({
      type: 'text',
      text: content.title,
      x: pad,
      y: titleY,
      size: titleSize,
      weight: 700,
      family,
      color: theme.fg,
      maxWidth,
      maxLines: landscape ? 3 : 6,
      lineHeight: 1.45,
      valign: 'top',
    })
    const lines = estimateLines(content.title, titleSize, maxWidth, landscape ? 3 : 6)
    if (content.subtitle)
      layers.push({
        type: 'text',
        text: `—— ${content.subtitle}`,
        x: pad,
        y: titleY + lines * titleSize * 1.45 + u * 4,
        size: u * 3.6,
        family,
        color: theme.muted,
        maxWidth,
        maxLines: 2,
        lineHeight: 1.5,
        valign: 'top',
      })
    if (content.tag) layers.push(tagLayer(content.tag, pad, H - pad - u * 5, u * 3, theme))
    if (content.footer)
      layers.push({
        type: 'text',
        text: content.footer,
        x: W - pad,
        y: H - pad,
        size: u * 3,
        color: theme.muted,
        align: 'right',
        valign: 'bottom',
      })
    return { width: W, height: H, background: theme.bg, layers }
  },
}

export const socialStyles: SocialStyle[] = [cover, card, polaroid, magazine, mosaic, quote]
