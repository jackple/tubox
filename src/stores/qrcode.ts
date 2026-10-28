import { create } from 'zustand'
import { canvasToBlob, createCanvas, decodeImage, getCtx, resample } from '@/core/canvas'
import type { ContactContent, QrContentType, WifiContent } from '@/core/qrcode/content'
import {
  type QrArtOptions,
  type QrArtStyle,
  type DotStyle,
  type EyeStyle,
  type QrColors,
  type QrEcc,
  type QrShape,
  drawQr,
  encodeQr,
  layoutQr,
  qrSvg,
} from '@/core/qrcode/render'
import { qrPayload } from '@/core/qrcode/content'
import { MIME_EXT, encodeCanvas } from '@/core/encode'
import { getMessages } from '@/i18n'
import { saveBlob } from '@/lib/download'

export type QrFormat = 'image/png' | 'image/jpeg' | 'image/svg+xml'

/** Logo 解码后的长边上限：足够 2048px 导出，也让 SVG 内嵌的 data URL 不至于过大 */
const LOGO_SIDE = 512
/** 艺术背景需要覆盖整张二维码，保留更多细节但限制内嵌 SVG 的体积 */
const ARTWORK_SIDE = 960

export interface QrLogo {
  bitmap: ImageBitmap
  /** PNG data URL，供 SVG 内嵌 */
  href: string
}

export interface QrArtwork {
  bitmap: ImageBitmap
  /** PNG data URL，供 SVG 内嵌 */
  href: string
}

export interface QrOptions {
  type: QrContentType
  url: string
  text: string
  wifi: WifiContent
  contact: ContactContent

  dots: DotStyle
  eyes: EyeStyle
  shape: QrShape
  fg: string
  gradient: boolean
  fg2: string
  eyeCustom: boolean
  eye: string
  bg: string
  transparent: boolean

  artStyle: QrArtStyle
  artPrompt: string
  artSeed: number
  /** 0-1 */
  artIntensity: number

  logoRatio: number
  logoPlate: boolean
  ecc: QrEcc
  margin: number
  size: number
  format: QrFormat
}

interface QrState extends QrOptions {
  logo: QrLogo | null
  artwork: QrArtwork | null
  update: (p: Partial<QrOptions>) => void
  setLogo: (file: File) => Promise<void>
  removeLogo: () => void
  setArtwork: (file: File) => Promise<void>
  removeArtwork: () => void
  shuffleArt: () => void
  /** 按当前设置渲染为 Blob；内容为空时返回 null */
  render: (format?: QrFormat) => Promise<Blob | null>
  exportImage: () => Promise<void>
}

export const qrColors = (s: QrOptions): QrColors => ({
  fg: s.fg,
  fg2: s.gradient ? s.fg2 : null,
  eye: s.eyeCustom ? s.eye : null,
  bg: s.transparent ? null : s.bg,
})

const promptSeed = (text: string) => {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

/** 预览与导出共用同一组艺术参数，提示词变化时构图也会稳定地跟着变化 */
export const qrArtOptions = (s: QrState): QrArtOptions | null =>
  s.artStyle === 'none'
    ? null
    : {
        style: s.artStyle,
        seed: (s.artSeed ^ promptSeed(s.artPrompt)) >>> 0,
        prompt: s.artPrompt,
        intensity: s.artIntensity,
        image: s.artwork?.bitmap ?? null,
      }

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(b)
  })

export const useQrCode = create<QrState>((set, get) => ({
  type: 'url',
  url: '',
  text: '',
  wifi: { ssid: '', password: '', encryption: 'WPA', hidden: false },
  contact: { name: '', phone: '', email: '', org: '', title: '', url: '' },

  dots: 'square',
  eyes: 'square',
  shape: 'square',
  fg: '#111114',
  gradient: false,
  fg2: '#6D4AFF',
  eyeCustom: false,
  eye: '#6D4AFF',
  bg: '#FFFFFF',
  transparent: false,

  artStyle: 'none',
  artPrompt: '',
  artSeed: 1,
  artIntensity: 0.62,

  logo: null,
  artwork: null,
  logoRatio: 0.22,
  logoPlate: true,
  ecc: 'M',
  margin: 2,
  size: 1024,
  format: 'image/png',

  update: (p) =>
    set((s) => {
      const artStyle = p.transparent ? 'none' : (p.artStyle ?? s.artStyle)
      const transparent = p.artStyle && p.artStyle !== 'none' ? false : (p.transparent ?? s.transparent)
      return {
        ...p,
        artStyle,
        transparent,
        // JPG 不支持透明，切到透明背景时改用 PNG
        format: transparent && (p.format ?? s.format) === 'image/jpeg' ? 'image/png' : (p.format ?? s.format),
      }
    }),

  setLogo: async (file) => {
    let bitmap = await decodeImage(file)
    const k = Math.min(1, LOGO_SIDE / Math.max(bitmap.width, bitmap.height))
    const c = resample(bitmap, { x: 0, y: 0, w: bitmap.width, h: bitmap.height }, bitmap.width * k, bitmap.height * k)
    if (k < 1) {
      bitmap.close()
      bitmap = await createImageBitmap(c)
    }
    const href = await blobToDataUrl(await canvasToBlob(c, 'image/png'))
    get().logo?.bitmap.close()
    // Logo 会遮挡部分码点，自动切到最高容错
    set({ logo: { bitmap, href }, ecc: 'H' })
  },

  removeLogo: () => {
    get().logo?.bitmap.close()
    set({ logo: null })
  },

  setArtwork: async (file) => {
    let bitmap = await decodeImage(file)
    const k = Math.min(1, ARTWORK_SIDE / Math.max(bitmap.width, bitmap.height))
    const c = resample(bitmap, { x: 0, y: 0, w: bitmap.width, h: bitmap.height }, bitmap.width * k, bitmap.height * k)
    if (k < 1) {
      bitmap.close()
      bitmap = await createImageBitmap(c)
    }
    const href = await blobToDataUrl(await canvasToBlob(c, 'image/png'))
    get().artwork?.bitmap.close()
    set({ artwork: { bitmap, href }, artStyle: get().artStyle === 'none' ? 'mist' : get().artStyle, transparent: false })
  },

  removeArtwork: () => {
    get().artwork?.bitmap.close()
    set({ artwork: null })
  },

  shuffleArt: () => set({ artSeed: (Math.random() * 0xffffffff) >>> 0 }),

  render: async (format = get().format) => {
    const s = get()
    const payload = qrPayload(s)
    if (!payload) return null
    const { logo } = s
    const layout = layoutQr(encodeQr(payload, s.ecc), {
      dots: s.dots,
      eyes: s.eyes,
      shape: s.shape,
      margin: s.margin,
      logo: logo && { ratio: s.logoRatio, aspect: logo.bitmap.width / logo.bitmap.height, plate: s.logoPlate },
    })
    const colors = qrColors(s)
    const art = qrArtOptions(s)
    if (format === 'image/svg+xml') {
      return new Blob([qrSvg(layout, colors, logo?.href ?? null, s.size, art && { ...art, imageHref: s.artwork?.href ?? null })], {
        type: format,
      })
    }
    const canvas = createCanvas(s.size, s.size)
    const ctx = getCtx(canvas)
    if (format === 'image/jpeg' && !colors.bg) {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, s.size, s.size)
    }
    drawQr(ctx, layout, colors, logo?.bitmap ?? null, s.size, art)
    return (await encodeCanvas(canvas, format, 0.95)).blob
  },

  exportImage: async () => {
    const { format } = get()
    const blob = await get().render()
    if (blob) saveBlob(blob, `${getMessages().qrcode.fileName}.${format === 'image/svg+xml' ? 'svg' : MIME_EXT[format]}`)
  },
}))
