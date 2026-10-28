/** 二维码内容：按类型拼出扫码后被识别的文本（网址 / 纯文本 / Wi-Fi 配网 / vCard 名片） */

export type QrContentType = 'url' | 'text' | 'wifi' | 'contact'
export type WifiEncryption = 'WPA' | 'WEP' | 'nopass'

export interface WifiContent {
  ssid: string
  password: string
  encryption: WifiEncryption
  hidden: boolean
}

export interface ContactContent {
  name: string
  phone: string
  email: string
  org: string
  title: string
  url: string
}

export interface QrContent {
  type: QrContentType
  url: string
  text: string
  wifi: WifiContent
  contact: ContactContent
}

/** Wi-Fi 二维码中需要转义的字符：\ ; , : " */
const escWifi = (s: string) => s.replace(/([\\;,:"])/g, '\\$1')
/** vCard 文本值中需要转义的字符 */
const escVcard = (s: string) => s.replace(/([\\;,])/g, '\\$1').replace(/\r?\n/g, '\\n')

/** 没有协议头的网址补 https:// */
export const normalizeUrl = (s: string) => {
  const t = s.trim()
  return !t || /^[a-z][\w+.-]*:/i.test(t) ? t : `https://${t}`
}

/** 内容为空时返回空串 */
export function qrPayload(c: QrContent): string {
  switch (c.type) {
    case 'url':
      return normalizeUrl(c.url)
    case 'text':
      return c.text.trim() ? c.text : ''
    case 'wifi': {
      const w = c.wifi
      if (!w.ssid) return ''
      const pass = w.encryption === 'nopass' ? '' : `P:${escWifi(w.password)};`
      return `WIFI:T:${w.encryption};S:${escWifi(w.ssid)};${pass}${w.hidden ? 'H:true;' : ''};`
    }
    case 'contact': {
      const k = c.contact
      const lines = [
        k.name && `N:${escVcard(k.name)};;;;`,
        k.name && `FN:${escVcard(k.name)}`,
        k.org && `ORG:${escVcard(k.org)}`,
        k.title && `TITLE:${escVcard(k.title)}`,
        k.phone && `TEL;TYPE=CELL:${k.phone.trim()}`,
        k.email && `EMAIL:${k.email.trim()}`,
        k.url && `URL:${normalizeUrl(k.url)}`,
      ].filter(Boolean)
      return lines.length ? ['BEGIN:VCARD', 'VERSION:3.0', ...lines, 'END:VCARD'].join('\r\n') : ''
    }
  }
}
