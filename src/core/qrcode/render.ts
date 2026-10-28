import { QrCodeDataType, encode } from 'uqr'
import { type Ctx2D, type Drawable, createCanvas, getCtx } from '../canvas'
import { coreError } from '../errors'

/**
 * 二维码排版与绘制：uqr 只负责编码出码点矩阵，样式（码点形状、定位点、Logo 挖空）在这里生成为 SVG path 数据，
 * 同一份 path 既用于 Canvas（Path2D，预览与 PNG / JPG 导出）也用于 SVG 导出，保证两者一致。
 * 坐标单位为「码点」，含四周留白。
 * 圆形外观：码区（含静区）内切于圆，码区与圆之间按固定规则撒装饰码点；扫码器只读取码区，装饰不影响识别。
 */

export type QrEcc = 'L' | 'M' | 'Q' | 'H'
export type DotStyle = 'square' | 'rounded' | 'dots' | 'vline' | 'hline'
export type EyeStyle = 'square' | 'rounded' | 'leaf' | 'circle'
export type QrShape = 'square' | 'circle'
export type QrArtStyle = 'none' | 'mist' | 'bloom' | 'ripple' | 'noir'

export interface QrMatrix {
  version: number
  /** 每边码点数（不含留白） */
  size: number
  dark: boolean[][]
  /** 定位图形（含分隔白边）所占的码点，单独按 EyeStyle 绘制 */
  finder: boolean[][]
  /** 其余功能图形（时序、校正图形与格式 / 版本信息）所占的码点 */
  fixed: boolean[][]
}

/** 圆点 / 线条样式在版本较高（码点较密）时部分扫码器难以识别，超过此版本给出提示 */
export const DOTS_MAX_VERSION = 10

export function encodeQr(text: string, ecc: QrEcc): QrMatrix {
  try {
    const r = encode(text, { ecc, border: 0 })
    return {
      version: r.version,
      size: r.size,
      dark: r.data,
      finder: r.types.map((row) => row.map((t) => t === QrCodeDataType.Position)),
      fixed: r.types.map((row) => row.map((t) => t !== QrCodeDataType.Data && t !== QrCodeDataType.Position)),
    }
  } catch {
    throw coreError('qr-too-long')
  }
}

export interface QrLayoutOptions {
  dots: DotStyle
  eyes: EyeStyle
  shape: QrShape
  /** 留白（码点数）；圆形外观下为码区与装饰码点之间的静区，至少 1 */
  margin: number
  /** ratio：Logo 长边占码区边长的比例；aspect：Logo 宽高比 */
  logo: { ratio: number; aspect: number; plate: boolean } | null
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface QrLayout {
  /** 总边长（码点单位，含留白） */
  n: number
  /** 渐变起止点距边缘的距离 */
  inset: number
  dots: string
  /** 定位点外框（环形，需按 evenodd 填充） */
  eyeOuter: string
  eyeInner: string
  logo: Box | null
  plate: (Box & { r: number }) | null
}

export interface QrArtPalette {
  /** 艺术画面的主色与底色 */
  from: string
  to: string
  /** 叠加图形使用的强调色 */
  accents: [string, string]
  /** 码点融合进画面时使用的深色 */
  ink: string
  /** 码点上方的浅色薄雾，用来稳定明暗差 */
  paper: string
}

/** 艺术码的固定配色；UI 预览、Canvas 与 SVG 导出共用 */
export const QR_ART_PALETTES: Record<Exclude<QrArtStyle, 'none'>, QrArtPalette> = {
  mist: { from: '#8FB8CE', to: '#F3C49D', accents: ['#164E63', '#EA580C'], ink: '#082F3D', paper: '#F5F8F7' },
  bloom: { from: '#FFB8D6', to: '#B9AEFF', accents: ['#9D174D', '#4D7C0F'], ink: '#3F1734', paper: '#FFF7FB' },
  ripple: { from: '#032733', to: '#0B8A83', accents: ['#F6C177', '#D9F99D'], ink: '#032F36', paper: '#EAF6F1' },
  noir: { from: '#E8D9C3', to: '#AAB2BD', accents: ['#111114', '#D97706'], ink: '#111114', paper: '#F7F3EC' },
}

const f = (v: number) => +v.toFixed(3)

/** 圆角矩形；各角半径可不同（顺序：左上、右上、右下、左下） */
function roundRect(x: number, y: number, w: number, h: number, r: number | [number, number, number, number]): string {
  const [tl, tr, br, bl] = typeof r === 'number' ? [r, r, r, r] : r
  const arc = (rad: number, ex: number, ey: number) => (rad ? `A${f(rad)} ${f(rad)} 0 0 1 ${f(ex)} ${f(ey)}` : '')
  return (
    `M${f(x + tl)} ${f(y)}H${f(x + w - tr)}${arc(tr, x + w, y + tr)}` +
    `V${f(y + h - br)}${arc(br, x + w - br, y + h)}` +
    `H${f(x + bl)}${arc(bl, x, y + h - bl)}` +
    `V${f(y + tl)}${arc(tl, x + tl, y)}Z`
  )
}

const circle = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0Z`

/** 单个定位点（7×7 外框 + 3×3 内芯），x / y 为左上角 */
function eye(style: EyeStyle, x: number, y: number): [outer: string, inner: string] {
  if (style === 'circle') return [circle(x + 3.5, y + 3.5, 3.5) + circle(x + 3.5, y + 3.5, 2.5), circle(x + 3.5, y + 3.5, 1.5)]
  // 叶形：左上、右下两个角倒圆
  const corners = (r: number): [number, number, number, number] => (style === 'leaf' ? [r, 0, r, 0] : [r, r, r, r])
  const [ro, rh, ri] = style === 'square' ? [0, 0, 0] : style === 'leaf' ? [3, 2.2, 1.3] : [2.2, 1.4, 0.9]
  return [roundRect(x, y, 7, 7, corners(ro)) + roundRect(x + 1, y + 1, 5, 5, corners(rh)), roundRect(x + 2, y + 2, 3, 3, corners(ri))]
}

/** 装饰码点的伪随机明暗（按坐标哈希，同一位置始终一致） */
const decorDark = (x: number, y: number) => {
  let h = Math.imul(x * 374761393 + y * 668265263, 1274126177)
  h ^= h >>> 15
  return (h >>> 0) % 100 < 42
}

export function layoutQr(m: QrMatrix, o: QrLayoutOptions): QrLayout {
  const { size } = m
  const round = o.shape === 'circle'
  const quiet = round ? Math.max(1, o.margin) : o.margin
  // 圆形：码区 + 静区的正方形内切于圆，圆外再留 1 格；保证 n - size 为偶数，码区落在整数格上
  let n = size + quiet * 2
  if (round) {
    n = Math.ceil(n * Math.SQRT2) + 2
    n += (n - size) % 2
  }
  const off = (n - size) / 2

  // Logo 居中，按宽高比放进 ratio × size 的方框；底板四周留出一圈
  let logo: Box | null = null
  let plate: QrLayout['plate'] = null
  if (o.logo) {
    const side = o.logo.ratio * size
    const w = o.logo.aspect >= 1 ? side : side * o.logo.aspect
    const h = o.logo.aspect >= 1 ? side / o.logo.aspect : side
    logo = { x: n / 2 - w / 2, y: n / 2 - h / 2, w, h }
    if (o.logo.plate) {
      const pad = Math.max(0.6, side * 0.08)
      plate = { x: logo.x - pad, y: logo.y - pad, w: w + pad * 2, h: h + pad * 2, r: Math.min(w, h) * 0.12 + pad }
    }
  }
  // Logo 下方的码点挖空，避免露出半截码点；略留容差，只挖明显被覆盖的码点
  const hole = plate ?? logo
  const covered = (x: number, y: number) =>
    !!hole && x + 0.85 > hole.x && x + 0.15 < hole.x + hole.w && y + 0.85 > hole.y && y + 0.15 < hole.y + hole.h

  // 整张图的码点网格（n×n）：码区码点 + 圆形外观的装饰码点；fixed 为需要保持方块的功能图形
  const dark = new Uint8Array(n * n)
  const fixed = new Uint8Array(n * n)
  const lo = off - quiet
  const hi = off + size + quiet
  const r2 = (n / 2 - 1) ** 2
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const i = y * n + x
      const cx = x - off
      const cy = y - off
      if (cx >= 0 && cy >= 0 && cx < size && cy < size) {
        dark[i] = +(m.dark[cy][cx] && !m.finder[cy][cx] && !covered(x, y))
        fixed[i] = +m.fixed[cy][cx]
      } else if (round && !(x >= lo && x < hi && y >= lo && y < hi)) {
        dark[i] = +((x + 0.5 - n / 2) ** 2 + (y + 0.5 - n / 2) ** 2 <= r2 && decorDark(x, y))
      }
    }
  }
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < n && y < n && dark[y * n + x] === 1

  const parts: string[] = []
  const lines = o.dots === 'vline' || o.dots === 'hline'
  if (o.dots === 'square' || lines) {
    // 按行（竖线按列）合并连续码点：方块直接拼成长条，线条画成胶囊
    const vertical = o.dots === 'vline'
    const w = 0.8
    // 线条样式下功能图形单独画成方块、不并入线条（同圆点样式），否则不少解码器定位失败
    const solid = (x: number, y: number) => lines && fixed[y * n + x] === 1
    for (let a = 0; a < n; a++) {
      for (let b = 0; b < n; b++) {
        const at = (k: number) => (vertical ? on(a, k) && !solid(a, k) : on(k, a) && !solid(k, a))
        if (lines && (vertical ? solid(a, b) && on(a, b) : solid(b, a) && on(b, a))) {
          parts.push(vertical ? `M${a} ${b}h1v1h-1Z` : `M${b} ${a}h1v1h-1Z`)
          continue
        }
        if (!at(b)) continue
        let end = b
        while (at(end + 1)) end++
        const len = end - b + 1
        if (!lines) parts.push(`M${b} ${a}h${len}v1h${-len}Z`)
        else {
          const g = (1 - w) / 2
          parts.push(vertical ? roundRect(a + g, b + g, w, len - g * 2, w / 2) : roundRect(b + g, a + g, len - g * 2, w, w / 2))
        }
        b = end
      }
    }
  } else {
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (!on(x, y)) continue
        if (o.dots === 'dots') {
          // 功能图形保持方块：时序 / 校正图形也画成圆点时，不少解码器会定位失败
          parts.push(fixed[y * n + x] ? `M${x} ${y}h1v1h-1Z` : circle(x + 0.5, y + 0.5, 0.45))
          continue
        }
        // 圆润：两条相邻边都没有码点的角才倒圆，相连的码点融为一体
        const up = on(x, y - 1)
        const down = on(x, y + 1)
        const left = on(x - 1, y)
        const right = on(x + 1, y)
        const r = 0.5
        parts.push(roundRect(x, y, 1, 1, [!up && !left ? r : 0, !up && !right ? r : 0, !down && !right ? r : 0, !down && !left ? r : 0]))
      }
    }
  }

  const eyes = [
    [off, off],
    [off + size - 7, off],
    [off, off + size - 7],
  ].map(([x, y]) => eye(o.eyes, x, y))

  return {
    n,
    inset: round ? 1 : off,
    dots: parts.join(''),
    eyeOuter: eyes.map((e) => e[0]).join(''),
    eyeInner: eyes.map((e) => e[1]).join(''),
    logo,
    plate,
  }
}

export interface QrColors {
  fg: string
  /** 渐变终止色（左上 → 右下）；null 为纯色 */
  fg2: string | null
  /** 定位点颜色；null 跟随码点 */
  eye: string | null
  /** null 为透明背景 */
  bg: string | null
}

export interface QrArtOptions {
  style: Exclude<QrArtStyle, 'none'>
  /** 同一提示词与 seed 会得到稳定构图 */
  seed: number
  /** 本地构图会根据主题词加入山、海、日落、森林等画面元素 */
  prompt: string
  /** 0-1，越高底图越明显；仍会保留一层用于扫码的浅色薄雾 */
  intensity: number
  image: Drawable | null
}

type ArtShape =
  | { kind: 'circle'; cx: number; cy: number; r: number; color: string; opacity: number; stroke?: number }
  | { kind: 'path'; d: string; color: string; opacity: number; stroke?: number }

/** 小巧的可重复随机数生成器，避免艺术构图在预览与导出时抖动 */
function artRandom(style: QrArtStyle, seed: number) {
  let state = (Math.imul(seed || 1, 0x9e3779b1) ^ Math.imul(style.length, 0x85ebca6b)) >>> 0
  return () => {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 生成不同风格共用的矢量图形，Canvas 与 SVG 使用同一套几何 */
function artShapes(style: Exclude<QrArtStyle, 'none'>, seed: number, n: number, prompt = ''): ArtShape[] {
  const rand = artRandom(style, seed)
  const p = QR_ART_PALETTES[style]
  const shapes: ArtShape[] = []
  const arc = (cx: number, cy: number, r: number, edge = 0.72) =>
    `M${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 ${edge > 0.5 ? 1 : 0} 1 ${f(cx + r)} ${f(cy)}` +
    `A${f(r)} ${f(r)} 0 ${edge > 0.5 ? 1 : 0} 1 ${f(cx - r)} ${f(cy)}Z`

  if (style === 'mist') {
    for (let i = 0; i < 5; i++) {
      shapes.push({
        kind: 'circle',
        cx: rand() * n,
        cy: rand() * n * 0.72,
        r: n * (0.08 + rand() * 0.23),
        color: i % 2 ? p.accents[0] : p.accents[1],
        opacity: 0.2 + rand() * 0.18,
      })
    }
    shapes.push(
      {
        kind: 'path',
        d: `M0 ${n * 0.62}Q${n * 0.24} ${n * 0.42} ${n * 0.48} ${n * 0.64}T${n} ${n * 0.58}V${n}H0Z`,
        color: p.accents[0],
        opacity: 0.34,
      },
      {
        kind: 'path',
        d: `M0 ${n * 0.78}Q${n * 0.3} ${n * 0.6} ${n * 0.58} ${n * 0.79}T${n} ${n * 0.72}V${n}H0Z`,
        color: p.accents[1],
        opacity: 0.28,
      },
    )
  } else if (style === 'bloom') {
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2 + rand() * 0.35
      const dist = n * (0.17 + rand() * 0.31)
      shapes.push({
        kind: 'circle',
        cx: n / 2 + Math.cos(a) * dist,
        cy: n / 2 + Math.sin(a) * dist,
        r: n * (0.07 + rand() * 0.14),
        color: i % 2 ? p.accents[0] : p.accents[1],
        opacity: 0.2 + rand() * 0.2,
      })
    }
    for (let i = 0; i < 5; i++) {
      shapes.push({
        kind: 'circle',
        cx: n / 2 + (rand() - 0.5) * n * 0.44,
        cy: n / 2 + (rand() - 0.5) * n * 0.44,
        r: n * (0.17 + rand() * 0.18),
        color: p.accents[0],
        opacity: 0.26,
        stroke: n * 0.007,
      })
    }
  } else if (style === 'ripple') {
    const cx = n * (0.35 + rand() * 0.3)
    const cy = n * (0.35 + rand() * 0.3)
    for (let i = 1; i <= 10; i++) {
      shapes.push({
        kind: 'circle',
        cx,
        cy,
        r: (n * i) / 12,
        color: i % 2 ? p.accents[0] : p.accents[1],
        opacity: 0.24 + (10 - i) * 0.018,
        stroke: n * 0.009,
      })
    }
    shapes.push(
      {
        kind: 'path',
        d: `M${-n * 0.1} ${n * 0.18}C${n * 0.28} ${n * 0.45} ${n * 0.56} ${-n * 0.02} ${n * 1.1} ${n * 0.32}`,
        color: p.accents[0],
        opacity: 0.54,
        stroke: n * 0.025,
      },
      {
        kind: 'path',
        d: `M${-n * 0.1} ${n * 0.84}C${n * 0.34} ${n * 0.56} ${n * 0.64} ${n * 1.06} ${n * 1.1} ${n * 0.7}`,
        color: p.accents[1],
        opacity: 0.42,
        stroke: n * 0.018,
      },
    )
  } else {
    for (let i = 0; i < 4; i++) {
      const y = n * (0.18 + i * 0.2)
      shapes.push({
        kind: 'path',
        d: `M${-n * 0.16} ${y + n * 0.12}L${n * 0.42} ${y - n * 0.2}L${n * 1.16} ${y + n * 0.03}`,
        color: i % 2 ? p.accents[1] : p.accents[0],
        opacity: 0.24 + i * 0.035,
        stroke: n * (0.035 + i * 0.012),
      })
    }
    for (let i = 0; i < 6; i++) {
      const r = n * (0.09 + rand() * 0.23)
      shapes.push({
        kind: 'circle',
        cx: rand() * n,
        cy: rand() * n,
        r,
        color: i % 2 ? p.accents[0] : p.accents[1],
        opacity: 0.16 + rand() * 0.16,
        stroke: i % 3 === 0 ? n * 0.008 : undefined,
      })
    }
    // 一个更完整的大圆，让画面有海报般的视觉重心
    shapes.push({ kind: 'path', d: arc(n * 0.66, n * 0.37, n * 0.29), color: p.accents[1], opacity: 0.28, stroke: n * 0.012 })
  }

  // 提示词不是远程生图模型，而是本地场景生成器的构图关键词；常见中英文主题都可用
  const text = prompt.toLowerCase()
  const has = (...words: string[]) => words.some((word) => text.includes(word))
  if (has('mountain', 'snow', '山', '雪')) {
    shapes.push({
      kind: 'path',
      d: `M0 ${n * 0.74}L${n * 0.25} ${n * 0.37}L${n * 0.43} ${n * 0.62}L${n * 0.7} ${n * 0.29}L${n} ${n * 0.66}V${n}H0Z`,
      color: p.ink,
      opacity: 0.34,
    })
  }
  if (has('sunset', 'sun', '日落', '夕阳', '太阳', '晚霞')) {
    shapes.push(
      { kind: 'circle', cx: n * 0.7, cy: n * 0.24, r: n * 0.105, color: p.accents[1], opacity: 0.72 },
      { kind: 'circle', cx: n * 0.7, cy: n * 0.24, r: n * 0.16, color: p.accents[1], opacity: 0.26, stroke: n * 0.012 },
    )
  }
  if (has('lake', 'ocean', 'river', 'water', 'wave', '湖', '海', '河', '水', '浪')) {
    for (let i = 0; i < 3; i++) {
      const y = n * (0.7 + i * 0.09)
      shapes.push({
        kind: 'path',
        d: `M${-n * 0.1} ${y}Q${n * 0.2} ${y - n * 0.08} ${n * 0.48} ${y} T${n * 1.1} ${y}`,
        color: i % 2 ? p.accents[0] : p.accents[1],
        opacity: 0.34,
        stroke: n * 0.026,
      })
    }
  }
  if (has('forest', 'tree', 'wood', '森林', '树', '林')) {
    for (let i = 0; i < 7; i++) {
      const x = n * (0.08 + i * 0.135)
      shapes.push(
        {
          kind: 'path',
          d: `M${x} ${n * 0.88}L${x + n * 0.018} ${n * 0.43}H${x - n * 0.018}Z`,
          color: p.ink,
          opacity: 0.3,
        },
        {
          kind: 'circle',
          cx: x,
          cy: n * (0.38 + rand() * 0.08),
          r: n * (0.09 + rand() * 0.04),
          color: p.accents[1],
          opacity: 0.28,
        },
      )
    }
  }
  if (has('flower', 'bloom', 'garden', '花', '繁花', '花园')) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      shapes.push({
        kind: 'circle',
        cx: n * 0.5 + Math.cos(a) * n * 0.12,
        cy: n * 0.42 + Math.sin(a) * n * 0.12,
        r: n * 0.075,
        color: p.accents[i % 2],
        opacity: 0.47,
      })
    }
  }
  if (has('city', 'cyber', 'neon', '都市', '城市', '赛博', '霓虹')) {
    for (let i = 0; i < 5; i++) {
      const x = n * (0.05 + i * 0.2)
      const h = n * (0.18 + rand() * 0.28)
      shapes.push({
        kind: 'path',
        d: `M${x} ${n * 0.86}V${n * 0.86 - h}H${x + n * 0.14}V${n * 0.86}Z`,
        color: i % 2 ? p.accents[0] : p.ink,
        opacity: 0.25,
      })
    }
  }
  return shapes
}

/** 艺术码底图；有照片时铺满裁切，并在上面叠加风格色块 */
function drawArtBase(ctx: Ctx2D, n: number, art: QrArtOptions) {
  const palette = QR_ART_PALETTES[art.style]
  ctx.save()
  ctx.globalAlpha = 1
  const bg = ctx.createLinearGradient(0, 0, n, n)
  bg.addColorStop(0, palette.from)
  bg.addColorStop(1, palette.to)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, n, n)
  if (art.image) {
    const scale = Math.max(n / art.image.width, n / art.image.height)
    const w = art.image.width * scale
    const h = art.image.height * scale
    ctx.drawImage(art.image, (n - w) / 2, (n - h) / 2, w, h)
  }

  for (const shape of artShapes(art.style, art.seed, n, art.prompt)) {
    ctx.globalAlpha = shape.opacity
    if (shape.kind === 'circle') {
      ctx.beginPath()
      ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2)
      if (shape.stroke) {
        ctx.strokeStyle = shape.color
        ctx.lineWidth = shape.stroke
        ctx.stroke()
      } else {
        ctx.fillStyle = shape.color
        ctx.fill()
      }
    } else {
      const path = new Path2D(shape.d)
      if (shape.stroke) {
        ctx.strokeStyle = shape.color
        ctx.lineWidth = shape.stroke
        ctx.lineCap = 'round'
        ctx.stroke(path)
      } else {
        ctx.fillStyle = shape.color
        ctx.fill(path)
      }
    }
  }

  if (art.image) {
    ctx.globalAlpha = 0.16
    ctx.fillStyle = palette.from
    ctx.fillRect(0, 0, n, n)
  }
  ctx.restore()
}

const rgb = (hex: string) => {
  const v = parseInt(hex.slice(1, 7), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255] as const
}
const clampByte = (v: number) => Math.max(0, Math.min(255, v))

/**
 * 把码点直接“印”进底图：暗码点保留照片纹理并压到低亮度，浅区则按需提亮。
 * 相比在照片上盖一层纯黑码点，这种方式更接近艺术码，也仍能保留扫码必需的局部对比。
 */
function fuseArtQr(ctx: Ctx2D, l: QrLayout, art: QrArtOptions, px: number) {
  const palette = QR_ART_PALETTES[art.style]
  const mask = createCanvas(px, px)
  const mctx = getCtx(mask, { willReadFrequently: true })
  mctx.scale(px / l.n, px / l.n)
  mctx.fillStyle = '#FFFFFF'
  mctx.fill(new Path2D(l.dots))
  mctx.fill(new Path2D(l.eyeOuter), 'evenodd')
  mctx.fill(new Path2D(l.eyeInner))
  mctx.setTransform(1, 0, 0, 1, 0, 0)

  const image = ctx.getImageData(0, 0, px, px)
  const marks = mctx.getImageData(0, 0, px, px)
  const [paperR, paperG, paperB] = rgb(palette.paper)
  const [inkR, inkG, inkB] = rgb(palette.ink)
  const minLight = 188 + (1 - Math.max(0, Math.min(1, art.intensity))) * 12
  const targetDark = 58 + Math.max(0, Math.min(1, art.intensity)) * 16
  const tone =
    art.style === 'noir'
      ? { saturation: 0.35, contrast: 1.2, tint: 0.08 }
      : art.style === 'bloom'
        ? { saturation: 1.25, contrast: 1.06, tint: 0.04 }
        : art.style === 'ripple'
          ? { saturation: 1.18, contrast: 1.1, tint: 0.05 }
          : { saturation: 1.02, contrast: 1.02, tint: 0.03 }

  for (let i = 0; i < image.data.length; i += 4) {
    const gray = (image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3
    const stylize = (ch: number, target: number) =>
      clampByte((gray + (clampByte(128 + (ch - 128) * tone.contrast) - gray) * tone.saturation) * (1 - tone.tint) + target * tone.tint)
    const r = stylize(image.data[i], inkR)
    const g = stylize(image.data[i + 1], inkG)
    const b = stylize(image.data[i + 2], inkB)
    const lum = (r * 299 + g * 587 + b * 114) / 1000

    // 浅区不整体蒙白：原本够亮的花纹保留，暗图才按需提亮到可辨认阈值
    let lr = r
    let lg = g
    let lb = b
    if (lum < minLight) {
      const k = Math.min(0.84, (minLight - lum) / Math.max(1, 255 - lum))
      lr += (paperR - r) * k
      lg += (paperG - g) * k
      lb += (paperB - b) * k
    }

    // 暗区压暗但不过度去色，让底图的色彩和肌理透过码点
    const factor = lum > targetDark ? targetDark / lum : 1
    const dr = r * factor * 0.84 + inkR * 0.16
    const dg = g * factor * 0.84 + inkG * 0.16
    const db = b * factor * 0.84 + inkB * 0.16
    const a = Math.max(0, Math.min(1, marks.data[i + 3] / 255))

    image.data[i] = lr + (dr - lr) * a
    image.data[i + 1] = lg + (dg - lg) * a
    image.data[i + 2] = lb + (db - lb) * a
    image.data[i + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
}

/** 在 ctx 上按 px × px 绘制（左上角为原点） */
export function drawQr(ctx: Ctx2D, l: QrLayout, c: QrColors, logo: Drawable | null, px: number, art: QrArtOptions | null = null) {
  const k = px / l.n
  ctx.save()
  ctx.scale(k, k)
  if (art) {
    const palette = QR_ART_PALETTES[art.style]
    // 底图在独立画布上做一次逐像素融合，避免预览画布反复读回像素
    const artwork = createCanvas(px, px)
    const actx = getCtx(artwork, { willReadFrequently: true })
    actx.scale(k, k)
    drawArtBase(actx, l.n, art)
    fuseArtQr(actx, l, art, px)
    ctx.drawImage(artwork, 0, 0, l.n, l.n)
    // 定位角保留一层很薄的浅底，再用实色重绘，避免照片纹理吃掉定位特征
    ctx.globalAlpha = 0.7
    ctx.fillStyle = palette.paper
    for (const [x, y] of [
      [l.inset, l.inset],
      [l.n - l.inset - 7, l.inset],
      [l.inset, l.n - l.inset - 7],
    ]) {
      ctx.fill(new Path2D(roundRect(x - 0.55, y - 0.55, 8.1, 8.1, 1.15)))
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = palette.ink
    ctx.fill(new Path2D(l.eyeOuter), 'evenodd')
    ctx.fill(new Path2D(l.eyeInner))
  } else if (c.bg) {
    ctx.fillStyle = c.bg
    ctx.fillRect(0, 0, l.n, l.n)
  }
  let fill: string | CanvasGradient = c.fg
  if (c.fg2) {
    const g = ctx.createLinearGradient(l.inset, l.inset, l.n - l.inset, l.n - l.inset)
    g.addColorStop(0, c.fg)
    g.addColorStop(1, c.fg2)
    fill = g
  }
  if (!art) {
    ctx.fillStyle = fill
    ctx.fill(new Path2D(l.dots))
    ctx.fillStyle = c.eye ?? fill
    ctx.fill(new Path2D(l.eyeOuter), 'evenodd')
    ctx.fill(new Path2D(l.eyeInner))
  }
  if (l.plate) {
    const p = l.plate
    ctx.fillStyle = c.bg ?? '#FFFFFF'
    ctx.fill(new Path2D(roundRect(p.x, p.y, p.w, p.h, p.r)))
  }
  if (logo && l.logo) ctx.drawImage(logo, l.logo.x, l.logo.y, l.logo.w, l.logo.h)
  ctx.restore()
}

export interface QrArtSvgOptions {
  style: Exclude<QrArtStyle, 'none'>
  seed: number
  prompt: string
  intensity: number
  imageHref: string | null
}

/** 矢量 SVG；logoHref / imageHref 均为内嵌 data URL */
export function qrSvg(l: QrLayout, c: QrColors, logoHref: string | null, px: number, art: QrArtSvgOptions | null = null): string {
  const fill = c.fg2 ? 'url(#qr-gradient)' : c.fg
  const artPalette = art ? QR_ART_PALETTES[art.style] : null
  const eyeFill = artPalette?.ink ?? c.eye ?? fill
  const p = l.plate
  const g = l.logo
  const e = l.n - l.inset
  const defs: string[] = []
  const body: string[] = []
  if (art && artPalette) {
    const palette = artPalette
    defs.push(
      `<linearGradient id="qr-art-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${l.n}" y2="${l.n}">` +
        `<stop offset="0" stop-color="${palette.from}"/><stop offset="1" stop-color="${palette.to}"/></linearGradient>`,
    )
    body.push(
      art.imageHref
        ? `<image href="${art.imageHref}" width="${l.n}" height="${l.n}" preserveAspectRatio="xMidYMid slice" style="filter:saturate(1.08) brightness(1.04)"/>`
        : `<rect width="${l.n}" height="${l.n}" fill="url(#qr-art-bg)"/>`,
    )
    for (const shape of artShapes(art.style, art.seed, l.n, art.prompt)) {
      const common = `fill="${shape.stroke ? 'none' : shape.color}" stroke="${shape.stroke ? shape.color : 'none'}" opacity="${f(shape.opacity)}"`
      if (shape.kind === 'circle') {
        body.push(
          `<circle cx="${f(shape.cx)}" cy="${f(shape.cy)}" r="${f(shape.r)}" ${common}` +
            `${shape.stroke ? ` stroke-width="${f(shape.stroke)}"` : ''}/>`,
        )
      } else {
        body.push(`<path d="${shape.d}" ${common}` + `${shape.stroke ? ` stroke-width="${f(shape.stroke)}" stroke-linecap="round"` : ''}/>`)
      }
    }
    defs.push(
      `<mask id="qr-art-dark" maskUnits="userSpaceOnUse" x="0" y="0" width="${l.n}" height="${l.n}">` +
        `<rect width="${l.n}" height="${l.n}" fill="black"/>` +
        `<path d="${l.dots}" fill="white"/>` +
        `<path d="${l.eyeOuter}" fill="white" fill-rule="evenodd"/>` +
        `<path d="${l.eyeInner}" fill="white"/></mask>`,
    )
    // SVG 中用“底图 + 半透明深色码点”近似 Canvas 的逐像素融合，PNG 导出则是完整算法
    body.push(
      `<rect width="${l.n}" height="${l.n}" fill="${palette.paper}" opacity="${f(Math.max(0.08, 0.2 - art.intensity * 0.1))}"/>`,
      `<rect width="${l.n}" height="${l.n}" fill="${palette.ink}" opacity="0.82" mask="url(#qr-art-dark)"/>`,
    )
    for (const [x, y] of [
      [l.inset, l.inset],
      [l.n - l.inset - 7, l.inset],
      [l.inset, l.n - l.inset - 7],
    ]) {
      body.push(`<rect x="${f(x - 0.55)}" y="${f(y - 0.55)}" width="8.1" height="8.1" rx="1.15" fill="${palette.paper}" opacity="0.68"/>`)
    }
    body.push(`<path d="${l.eyeOuter}" fill="${palette.ink}" fill-rule="evenodd"/>`, `<path d="${l.eyeInner}" fill="${palette.ink}"/>`)
  } else if (c.bg) {
    body.push(`<rect width="${l.n}" height="${l.n}" fill="${c.bg}"/>`)
  }
  if (c.fg2) {
    defs.push(
      `<linearGradient id="qr-gradient" gradientUnits="userSpaceOnUse" x1="${l.inset}" y1="${l.inset}" x2="${e}" y2="${e}">` +
        `<stop offset="0" stop-color="${c.fg}"/><stop offset="1" stop-color="${c.fg2}"/></linearGradient>`,
    )
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${l.n} ${l.n}" width="${px}" height="${px}">`,
    defs.length ? `<defs>${defs.join('')}</defs>` : '',
    ...body,
    !art && `<path d="${l.dots}" fill="${fill}"/>`,
    !art && `<path d="${l.eyeOuter}" fill="${eyeFill}" fill-rule="evenodd"/>`,
    !art && `<path d="${l.eyeInner}" fill="${eyeFill}"/>`,
    p && `<path d="${roundRect(p.x, p.y, p.w, p.h, p.r)}" fill="${artPalette?.paper ?? c.bg ?? '#FFFFFF'}"/>`,
    g &&
      logoHref &&
      `<image href="${logoHref}" x="${f(g.x)}" y="${f(g.y)}" width="${f(g.w)}" height="${f(g.h)}" preserveAspectRatio="none"/>`,
    '</svg>',
  ]
    .filter(Boolean)
    .join('\n')
}

/** 相对亮度（0-1，#rrggbb） */
export function luminance(hex: string): number {
  const v = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16)
  const ch = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}

/** WCAG 对比度（1-21），用于提示颜色过浅可能扫不出 */
export function contrastRatio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
