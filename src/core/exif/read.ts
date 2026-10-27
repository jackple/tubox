import { type ImageFormat, type MetaBlock, type MetaKind, scanMetadata } from './scan'

/**
 * 元数据报告：从 EXIF（TIFF 结构）、XMP、PNG 文本块中提取与隐私相关的字段。
 * 只返回原始值，显示名与格式化在 UI 层完成。
 */
export interface MetaReport {
  format: ImageFormat
  /** 存在的元数据类型（去重，按出现顺序） */
  kinds: MetaKind[]
  /** 元数据总字节数 */
  bytes: number
  gps?: { lat: number; lng: number; alt?: number }
  device?: string
  lens?: string
  serial?: string
  /** 拍摄时间，形如 2024-06-01 12:30:45 */
  taken?: string
  /** 拍摄参数，形如 1/120s · f/1.8 · ISO 100 · 26mm */
  exposure?: string
  software?: string
  author?: string
  description?: string
  /** EXIF 方向（1-8），1 为正常 */
  orientation: number
  /** EXIF 内嵌缩略图（可能保留裁剪 / 修图前的画面） */
  thumbnail: boolean
  /** PNG 文本块等键值（如 AI 绘图软件写入的提示词） */
  texts: { key: string; value: string }[]
}

type TiffValue = number | number[] | string
type Ifd = Map<number, TiffValue>

const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8, 11: 4, 12: 8 }

/** 解析 TIFF 结构中的 IFD0 / EXIF / GPS 三个目录 */
function parseTiff(b: Uint8Array, start: number, end: number) {
  if (end - start < 8) return null
  const view = new DataView(b.buffer, b.byteOffset + start, end - start)
  const le = view.getUint16(0) === 0x4949
  if (view.getUint16(2, le) !== 42) return null
  const len = view.byteLength

  const readIfd = (off: number): { ifd: Ifd; next: number } => {
    const ifd: Ifd = new Map()
    if (off <= 0 || off + 2 > len) return { ifd, next: 0 }
    const n = view.getUint16(off, le)
    for (let k = 0; k < n; k++) {
      const e = off + 2 + k * 12
      if (e + 12 > len) break
      const tag = view.getUint16(e, le)
      const type = view.getUint16(e + 2, le)
      const count = view.getUint32(e + 4, le)
      const size = TYPE_SIZE[type]
      if (!size || count === 0) continue
      const total = size * count
      const at = total <= 4 ? e + 8 : view.getUint32(e + 8, le)
      if (at + total > len) continue
      if (type === 2) {
        const bytes = new Uint8Array(view.buffer, view.byteOffset + at, count)
        ifd.set(tag, new TextDecoder().decode(bytes).replace(/\0+$/, '').trim())
        continue
      }
      const vals: number[] = []
      for (let j = 0; j < Math.min(count, 64); j++) {
        const p = at + j * size
        if (type === 1 || type === 7) vals.push(view.getUint8(p))
        else if (type === 3) vals.push(view.getUint16(p, le))
        else if (type === 4) vals.push(view.getUint32(p, le))
        else if (type === 9) vals.push(view.getInt32(p, le))
        else if (type === 5) vals.push(view.getUint32(p, le) / (view.getUint32(p + 4, le) || 1))
        else if (type === 10) vals.push(view.getInt32(p, le) / (view.getInt32(p + 4, le) || 1))
        else if (type === 11) vals.push(view.getFloat32(p, le))
        else if (type === 12) vals.push(view.getFloat64(p, le))
      }
      ifd.set(tag, count === 1 ? vals[0] : vals)
    }
    const nextAt = off + 2 + n * 12
    return { ifd, next: nextAt + 4 <= len ? view.getUint32(nextAt, le) : 0 }
  }

  const { ifd: ifd0, next } = readIfd(view.getUint32(4, le))
  const ptr = (tag: number) => (typeof ifd0.get(tag) === 'number' ? (ifd0.get(tag) as number) : 0)
  return { ifd0, exif: readIfd(ptr(0x8769)).ifd, gps: readIfd(ptr(0x8825)).ifd, thumbnail: next > 0 && next < len }
}

const str = (v: TiffValue | undefined) => (typeof v === 'string' && v ? v : undefined)
const num = (v: TiffValue | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : Array.isArray(v) ? v[0] : undefined)

/** 度分秒 → 十进制度 */
function dms(v: TiffValue | undefined, ref: TiffValue | undefined) {
  if (!Array.isArray(v) || v.length < 3) return undefined
  const d = v[0] + v[1] / 60 + v[2] / 3600
  if (!Number.isFinite(d)) return undefined
  return typeof ref === 'string' && /[SW]/i.test(ref) ? -d : d
}

/** EXIF 时间 2024:06:01 12:30:45 → 2024-06-01 12:30:45 */
const exifDate = (v: TiffValue | undefined) => str(v)?.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')

function exposureText(exif: Ifd) {
  const parts: string[] = []
  const t = num(exif.get(0x829a))
  if (t) parts.push(t >= 1 ? `${+t.toFixed(1)}s` : `1/${Math.round(1 / t)}s`)
  const f = num(exif.get(0x829d))
  if (f) parts.push(`f/${+f.toFixed(1)}`)
  const iso = num(exif.get(0x8827))
  if (iso) parts.push(`ISO ${iso}`)
  const fl = num(exif.get(0x920a))
  if (fl) parts.push(`${+fl.toFixed(1)}mm`)
  return parts.length ? parts.join(' · ') : undefined
}

/** XMP 中的 GPS（如 exif:GPSLatitude="31,14.1234N"），EXIF 中没有位置时作为补充 */
function xmpGps(xmp: string) {
  const parse = (name: string) => {
    const m = new RegExp(`exif:${name}(?:="|>)(\\d+),(\\d+(?:\\.\\d+)?)(?:,(\\d+(?:\\.\\d+)?))?([NSEW])`).exec(xmp)
    if (!m) return undefined
    const d = Number(m[1]) + Number(m[2]) / 60 + (m[3] ? Number(m[3]) / 3600 : 0)
    return /[SW]/.test(m[4]) ? -d : d
  }
  const lat = parse('GPSLatitude')
  const lng = parse('GPSLongitude')
  return lat !== undefined && lng !== undefined ? { lat, lng } : undefined
}

const latin1 = new TextDecoder('latin1')
const utf8 = new TextDecoder()
const clip = (s: string) => (s.length > 300 ? `${s.slice(0, 300)}…` : s)

/** PNG tEXt / iTXt 键值（zTXt 为压缩文本，只列出键名） */
function pngText(b: Uint8Array, block: MetaBlock, type: string): { key: string; value: string } | null {
  const [s, e] = block.payload
  const data = b.subarray(s, e)
  const nul = data.indexOf(0)
  if (nul <= 0) return null
  const key = latin1.decode(data.subarray(0, nul))
  if (type === 'tEXt') return { key, value: clip(latin1.decode(data.subarray(nul + 1))) }
  if (type === 'iTXt' && data[nul + 1] === 0) {
    // 关键字\0 压缩标记 压缩方法 语言\0 翻译关键字\0 文本
    let p = data.indexOf(0, nul + 3)
    p = p < 0 ? -1 : data.indexOf(0, p + 1)
    if (p > 0) return { key, value: clip(utf8.decode(data.subarray(p + 1))) }
  }
  return { key, value: '…' }
}

export function readMetadata(b: Uint8Array): MetaReport {
  const { format, blocks } = scanMetadata(b)
  const report: MetaReport = {
    format,
    kinds: [...new Set(blocks.map((x) => x.kind))],
    bytes: blocks.reduce((s, x) => s + x.end - x.start, 0),
    orientation: 1,
    thumbnail: false,
    texts: [],
  }

  const exifBlock = blocks.find((x) => x.kind === 'exif')
  const tiff = exifBlock && parseTiff(b, ...exifBlock.payload)
  if (tiff) {
    const { ifd0, exif, gps } = tiff
    const make = str(ifd0.get(0x010f))
    const model = str(ifd0.get(0x0110))
    // 很多厂商的型号已包含品牌名（如 Canon EOS R5）
    report.device = make && model && !model.toLowerCase().startsWith(make.toLowerCase().split(' ')[0]) ? `${make} ${model}` : model || make
    const lensMake = str(exif.get(0xa433))
    const lensModel = str(exif.get(0xa434))
    report.lens = lensModel ? (lensMake && !lensModel.startsWith(lensMake) ? `${lensMake} ${lensModel}` : lensModel) : undefined
    report.serial = str(exif.get(0xa431)) ?? str(exif.get(0xa420))
    report.taken = exifDate(exif.get(0x9003)) ?? exifDate(ifd0.get(0x0132))
    const offset = str(exif.get(0x9011))
    if (report.taken && offset) report.taken += ` (UTC${offset})`
    report.exposure = exposureText(exif)
    report.software = str(ifd0.get(0x0131))
    const author = [str(ifd0.get(0x013b)), str(exif.get(0xa430)), str(ifd0.get(0x8298))].filter(Boolean)
    report.author = author.length ? [...new Set(author)].join(' · ') : undefined
    report.description = str(ifd0.get(0x010e))
    report.orientation = num(ifd0.get(0x0112)) ?? 1
    report.thumbnail = tiff.thumbnail

    const lat = dms(gps.get(2), gps.get(1))
    const lng = dms(gps.get(4), gps.get(3))
    // 部分设备在无定位时写入 0,0
    if (lat !== undefined && lng !== undefined && (lat !== 0 || lng !== 0)) {
      const alt = num(gps.get(6))
      report.gps = { lat, lng, alt: alt === undefined ? undefined : gps.get(5) === 1 ? -alt : alt }
    }
  }

  const xmpBlock = blocks.find((x) => x.kind === 'xmp')
  if (xmpBlock && !report.gps) report.gps = xmpGps(utf8.decode(b.subarray(...xmpBlock.payload)))

  if (format === 'png') {
    const view = new DataView(b.buffer, b.byteOffset, b.byteLength)
    for (const x of blocks) {
      if (x.kind !== 'text') continue
      const type = String.fromCharCode(...b.subarray(x.start + 4, x.start + 8))
      if (type === 'tIME') {
        const y = view.getUint16(x.payload[0])
        const [mo, d, h, mi, s] = b.subarray(x.payload[0] + 2, x.payload[0] + 7)
        const p = (n: number) => String(n).padStart(2, '0')
        report.texts.push({ key: 'tIME', value: `${y}-${p(mo)}-${p(d)} ${p(h)}:${p(mi)}:${p(s)}` })
        continue
      }
      const t = pngText(b, x, type)
      if (t) report.texts.push(t)
    }
  }
  return report
}

/** 是否含有需要关注的隐私信息（位置、设备、作者等） */
export const hasPrivateInfo = (r: MetaReport) => !!(r.gps || r.device || r.serial || r.author || r.taken || r.texts.length)
