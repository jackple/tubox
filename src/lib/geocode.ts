/**
 * 坐标反查地址（OpenStreetMap Nominatim）。
 * 这是全站唯一会把照片相关数据发往第三方的地方，只能由用户点击触发，不要自动调用。
 * Nominatim 使用政策：每秒最多 1 次请求、展示结果时注明 © OpenStreetMap 贡献者。
 */

/** 从大到小的行政层级（同一层级取第一个存在的字段） */
const LEVELS = [
  ['country'],
  ['state', 'province', 'region'],
  ['city', 'town', 'village', 'municipality'],
  ['county', 'city_district', 'district', 'borough'],
  ['suburb'],
  ['quarter', 'neighbourhood', 'hamlet'],
  ['road'],
  ['house_number'],
]

const cache = new Map<string, Promise<string>>()
const resolved = new Map<string, string>()
let last = 0

const keyOf = (lat: number, lng: number, lang: string) => `${lat.toFixed(5)},${lng.toFixed(5)},${lang}`

/** 已查询过的地址（同步读取，用于重新展开时直接显示） */
export const cachedAddress = (lat: number, lng: number, lang: string) => resolved.get(keyOf(lat, lng, lang))

/** 反查地址，按界面语言习惯拼接：中日文从大到小直接连写，韩文从大到小以空格分隔，其余从小到大以逗号分隔 */
export function reverseGeocode(lat: number, lng: number, lang: string): Promise<string> {
  const key = keyOf(lat, lng, lang)
  let p = cache.get(key)
  if (!p) {
    p = (async () => {
      const wait = last + 1100 - Date.now()
      last = Math.max(Date.now(), last + 1100)
      if (wait > 0) await new Promise((r) => setTimeout(r, wait))
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}&accept-language=${encodeURIComponent(lang)}`
      const res = await fetch(url, { referrerPolicy: 'strict-origin-when-cross-origin' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: { name?: string; display_name?: string; address?: Record<string, string>; error?: string } = await res.json()
      if (data.error || !data.address) throw new Error(data.error ?? 'no address')
      const a = data.address
      const parts: string[] = []
      for (const level of LEVELS) {
        const v = level.map((k) => a[k]).find(Boolean)
        // 直辖市等 state 与 city 同名，去重
        if (v && !parts.includes(v)) parts.push(v)
      }
      if (data.name && !parts.includes(data.name)) parts.push(data.name)
      if (!parts.length) return data.display_name ?? ''
      if (/^(zh|ja)/.test(lang)) return parts.join('')
      if (lang.startsWith('ko')) return parts.join(' ')
      return parts.reverse().join(', ')
    })()
    cache.set(key, p)
    // 失败不缓存，允许重试
    p.then(
      (v) => resolved.set(key, v),
      () => cache.delete(key),
    )
  }
  return p
}

/** 在 OpenStreetMap 中查看（WGS-84 坐标，与 EXIF 一致，无需纠偏） */
export const osmUrl = (lat: number, lng: number) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`
