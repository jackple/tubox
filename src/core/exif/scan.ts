/**
 * 按容器格式扫描图片文件中的元数据块（只解析文件结构，不解码像素）。
 * 支持 JPEG（APPn / COM 段）、PNG（辅助块）、WebP（RIFF 块）、GIF（扩展块）。
 */

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'other'

/** exif：拍摄信息；xmp：编辑软件写入的扩展信息；iptc：图片社 / 新闻元数据；icc：色彩配置；comment：注释；text：文本块；other：其它私有段 */
export type MetaKind = 'exif' | 'xmp' | 'iptc' | 'icc' | 'comment' | 'text' | 'other'

export interface MetaBlock {
  kind: MetaKind
  /** 整块在文件中的范围 [start, end)，删除时整体移除 */
  start: number
  end: number
  /** 载荷范围：EXIF 为 TIFF 数据，文本类为原始字节 */
  payload: [number, number]
}

export interface ScanResult {
  format: ImageFormat
  blocks: MetaBlock[]
}

const ascii = (b: Uint8Array, start: number, len: number) => String.fromCharCode(...b.subarray(start, start + len))
const startsWith = (b: Uint8Array, at: number, s: string) => at + s.length <= b.length && ascii(b, at, s.length) === s

export function detectFormat(b: Uint8Array): ImageFormat {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg'
  if (b[0] === 0x89 && startsWith(b, 1, 'PNG\r\n\x1a\n')) return 'png'
  if (startsWith(b, 0, 'RIFF') && startsWith(b, 8, 'WEBP')) return 'webp'
  if (startsWith(b, 0, 'GIF87a') || startsWith(b, 0, 'GIF89a')) return 'gif'
  return 'other'
}

export function scanMetadata(b: Uint8Array): ScanResult {
  const format = detectFormat(b)
  const blocks =
    format === 'jpeg' ? scanJpeg(b) : format === 'png' ? scanPng(b) : format === 'webp' ? scanWebp(b) : format === 'gif' ? scanGif(b) : []
  return { format, blocks }
}

/* ───────── JPEG ───────── */

function scanJpeg(b: Uint8Array): MetaBlock[] {
  const out: MetaBlock[] = []
  let i = 2
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) break
    const marker = b[i + 1]
    // 填充字节与无长度的独立标记
    if (marker === 0xff) {
      i++
      continue
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      i += 2
      continue
    }
    // SOS 之后是熵编码数据，元数据段都在其之前
    if (marker === 0xd9 || marker === 0xda) break
    const end = i + 2 + ((b[i + 2] << 8) | b[i + 3])
    if (end > b.length) break
    const p = i + 4
    const add = (kind: MetaKind, skip = 0) => out.push({ kind, start: i, end, payload: [p + skip, end] })
    if (marker === 0xe1) {
      if (startsWith(b, p, 'Exif\0')) add('exif', 6)
      else if (startsWith(b, p, 'http://ns.adobe.com/')) {
        // 命名空间字符串以 \0 结尾，其后为 XMP 文本
        const nul = b.indexOf(0, p)
        add('xmp', nul > 0 && nul < end ? nul + 1 - p : 0)
      } else add('other')
    } else if (marker === 0xe2) add(startsWith(b, p, 'ICC_PROFILE\0') ? 'icc' : 'other')
    else if (marker === 0xed) add('iptc')
    else if (marker === 0xfe) add('comment')
    // APP0（JFIF）与 APP14（Adobe 色彩变换）影响解码，保留
    else if (marker >= 0xe3 && marker <= 0xef && marker !== 0xee) add('other')
    i = end
  }
  return out
}

/* ───────── PNG ───────── */

function scanPng(b: Uint8Array): MetaBlock[] {
  const out: MetaBlock[] = []
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength)
  let i = 8
  while (i + 12 <= b.length) {
    const len = view.getUint32(i)
    const type = ascii(b, i + 4, 4)
    const end = i + 12 + len
    if (end > b.length || type === 'IEND') break
    const payload: [number, number] = [i + 8, i + 8 + len]
    const add = (kind: MetaKind) => out.push({ kind, start: i, end, payload })
    if (type === 'eXIf') add('exif')
    else if (type === 'iCCP') add('icc')
    else if (type === 'iTXt' && startsWith(b, i + 8, 'XML:com.adobe.xmp\0')) add('xmp')
    else if (type === 'tEXt' || type === 'zTXt' || type === 'iTXt' || type === 'tIME') add('text')
    i = end
  }
  return out
}

/* ───────── WebP ───────── */

function scanWebp(b: Uint8Array): MetaBlock[] {
  const out: MetaBlock[] = []
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength)
  let i = 12
  while (i + 8 <= b.length) {
    const type = ascii(b, i, 4)
    const len = view.getUint32(i + 4, true)
    const end = Math.min(b.length, i + 8 + len + (len & 1))
    const p = i + 8
    if (type === 'EXIF') out.push({ kind: 'exif', start: i, end, payload: [startsWith(b, p, 'Exif\0\0') ? p + 6 : p, p + len] })
    else if (type === 'XMP ') out.push({ kind: 'xmp', start: i, end, payload: [p, p + len] })
    else if (type === 'ICCP') out.push({ kind: 'icc', start: i, end, payload: [p, p + len] })
    i = end
  }
  return out
}

/* ───────── GIF ───────── */

/** 跳过一串子块（长度字节 + 数据，以 0 结尾），返回结束位置 */
function skipSubBlocks(b: Uint8Array, i: number) {
  while (i < b.length && b[i] !== 0) i += b[i] + 1
  return i + 1
}

function scanGif(b: Uint8Array): MetaBlock[] {
  const out: MetaBlock[] = []
  const tableSize = (packed: number) => (packed & 0x80 ? 3 * (1 << ((packed & 7) + 1)) : 0)
  let i = 13 + tableSize(b[10])
  while (i < b.length) {
    const t = b[i]
    if (t === 0x21) {
      const label = b[i + 1]
      const end = skipSubBlocks(b, i + 2)
      const payload: [number, number] = [i + 2, end]
      if (label === 0xfe) out.push({ kind: 'comment', start: i, end, payload })
      else if (label === 0xff) {
        const id = ascii(b, i + 3, 11)
        // 循环次数扩展必须保留
        if (id !== 'NETSCAPE2.0' && id !== 'ANIMEXTS1.0') out.push({ kind: id === 'XMP DataXMP' ? 'xmp' : 'other', start: i, end, payload })
      }
      i = end
    } else if (t === 0x2c) {
      i += 10 + tableSize(b[i + 9])
      i = skipSubBlocks(b, i + 1)
    } else break
  }
  return out
}
