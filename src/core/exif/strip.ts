import { type MetaBlock, scanMetadata } from './scan'

export interface StripOptions {
  /** 保留方向：EXIF 方向不为 1 时写回一个只含方向的最小 EXIF，避免照片被「转倒」 */
  keepOrientation: boolean
  /** 保留 ICC 色彩配置，避免广色域照片偏色 */
  keepColorProfile: boolean
}

/** 只含 Orientation 一个标签的 TIFF（大端序），26 字节 */
function orientationTiff(orientation: number) {
  // prettier-ignore
  return new Uint8Array([
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08,
    0x00, 0x01,
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, orientation & 0xff, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ])
}

const bytesOf = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0))

function concat(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

/** 去掉若干区间，并在 insertAt 处插入 insert */
function rebuild(b: Uint8Array, remove: MetaBlock[], insertAt = 0, insert?: Uint8Array) {
  const parts: Uint8Array[] = []
  let cur = 0
  const cut = [...remove].sort((x, y) => x.start - y.start)
  for (const r of cut) {
    if (insert && insertAt >= cur && insertAt <= r.start) {
      parts.push(b.subarray(cur, insertAt), insert)
      cur = insertAt
      insert = undefined
    }
    parts.push(b.subarray(cur, r.start))
    cur = Math.max(cur, r.end)
  }
  if (insert) {
    const at = Math.max(cur, insertAt)
    parts.push(b.subarray(cur, at), insert)
    cur = at
  }
  parts.push(b.subarray(cur))
  return concat(parts)
}

let crcTable: Uint32Array | null = null
function crc32(data: Uint8Array) {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      crcTable[n] = c >>> 0
    }
  }
  let c = 0xffffffff
  for (let i = 0; i < data.length; i++) c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/**
 * 无损清除元数据：直接删除文件中的元数据段，不重新编码像素，画质与体积（除元数据外）不变。
 * 不支持的格式返回 null，由调用方重新编码。
 */
export function stripMetadata(b: Uint8Array, o: StripOptions, orientation: number): Uint8Array | null {
  const { format, blocks } = scanMetadata(b)
  const remove = blocks.filter((x) => !(x.kind === 'icc' && o.keepColorProfile))
  const tiff = o.keepOrientation && orientation > 1 && orientation <= 8 ? orientationTiff(orientation) : undefined

  if (format === 'jpeg') {
    // APP1：FFE1 + 长度 + "Exif\0\0" + TIFF；JFIF 规定 APP0 必须紧跟 SOI，插在其后
    const app1 = tiff && concat([new Uint8Array([0xff, 0xe1, 0, 8 + tiff.length]), bytesOf('Exif\0\0'), tiff])
    const at = b[2] === 0xff && b[3] === 0xe0 ? 4 + ((b[4] << 8) | b[5]) : 2
    return rebuild(b, remove, at, app1)
  }

  if (format === 'png') {
    // eXIf 块须在 IDAT 之前，插在 IHDR（固定 25 字节）之后
    let chunk: Uint8Array | undefined
    if (tiff) {
      const body = concat([bytesOf('eXIf'), tiff])
      chunk = new Uint8Array(12 + tiff.length)
      const v = new DataView(chunk.buffer)
      v.setUint32(0, tiff.length)
      chunk.set(body, 4)
      v.setUint32(8 + tiff.length, crc32(body))
    }
    return rebuild(b, remove, 33, chunk)
  }

  if (format === 'webp') {
    const hasVp8x = String.fromCharCode(...b.subarray(12, 16)) === 'VP8X'
    // 只有扩展格式（VP8X）才能携带 EXIF
    const chunk = tiff && hasVp8x ? concat([bytesOf('EXIF'), new Uint8Array([tiff.length, 0, 0, 0]), tiff]) : undefined
    const out = rebuild(b, remove, b.length, chunk)
    const v = new DataView(out.buffer)
    v.setUint32(4, out.length - 8, true)
    if (hasVp8x) {
      // VP8X 标志位：ICC 0x20、EXIF 0x08、XMP 0x04
      const kept = (k: string) => blocks.some((x) => x.kind === k && !remove.includes(x))
      let flags = out[20] & ~(0x20 | 0x08 | 0x04)
      if (kept('icc')) flags |= 0x20
      if (chunk) flags |= 0x08
      out[20] = flags
    }
    return out
  }

  if (format === 'gif') return rebuild(b, remove)
  return null
}
