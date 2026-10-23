/**
 * 语言表与多语言路由。纯数据 + 纯函数，同时被运行时和构建时（scripts/seo-plugin.ts）使用，
 * 因此这里及 messages/ 下的文件只能用相对路径导入，不能用 `@/` 别名。
 *
 * 路由约定：默认语言（简体中文）不带前缀，保持原有地址；其余语言加前缀，如 /en/batch、/zh-tw/collage/grid。
 */

export interface LocaleMeta {
  code: Locale
  /** URL 前缀，默认语言为空串 */
  prefix: string
  /** 语言名（用该语言自身书写），用于切换菜单 */
  label: string
  /** <html lang> 与 hreflang */
  htmlLang: string
  /** og:locale */
  ogLocale: string
}

export type Locale = 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko' | 'es' | 'fr' | 'de' | 'pt' | 'ru'

export const defaultLocale: Locale = 'zh-CN'

export const locales: LocaleMeta[] = [
  { code: 'zh-CN', prefix: '', label: '简体中文', htmlLang: 'zh-CN', ogLocale: 'zh_CN' },
  { code: 'zh-TW', prefix: 'zh-tw', label: '繁體中文', htmlLang: 'zh-TW', ogLocale: 'zh_TW' },
  { code: 'en', prefix: 'en', label: 'English', htmlLang: 'en', ogLocale: 'en_US' },
  { code: 'ja', prefix: 'ja', label: '日本語', htmlLang: 'ja', ogLocale: 'ja_JP' },
  { code: 'ko', prefix: 'ko', label: '한국어', htmlLang: 'ko', ogLocale: 'ko_KR' },
  { code: 'es', prefix: 'es', label: 'Español', htmlLang: 'es', ogLocale: 'es_ES' },
  { code: 'fr', prefix: 'fr', label: 'Français', htmlLang: 'fr', ogLocale: 'fr_FR' },
  { code: 'de', prefix: 'de', label: 'Deutsch', htmlLang: 'de', ogLocale: 'de_DE' },
  { code: 'pt', prefix: 'pt', label: 'Português', htmlLang: 'pt-BR', ogLocale: 'pt_BR' },
  { code: 'ru', prefix: 'ru', label: 'Русский', htmlLang: 'ru', ogLocale: 'ru_RU' },
]

export const localeMeta = (code: Locale) => locales.find((l) => l.code === code)!

export const isLocale = (v: string | null | undefined): v is Locale => !!v && locales.some((l) => l.code === v)

/** 拆分路径中的语言前缀：/en/batch → { locale: 'en', path: '/batch' } */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const [, first = '', ...rest] = pathname.split('/')
  const hit = locales.find((l) => l.prefix && l.prefix === first.toLowerCase())
  const path = hit ? '/' + rest.join('/') : pathname
  return { locale: hit?.code ?? defaultLocale, path: path.replace(/\/+$/, '') || '/' }
}

/** 给不带语言的路径加上前缀：('/batch', 'en') → /en/batch，('/', 'en') → /en */
export function localizePath(path: string, locale: Locale): string {
  const { prefix } = localeMeta(locale)
  if (!prefix) return path
  return path === '/' ? `/${prefix}` : `/${prefix}${path}`
}

/** 把浏览器语言（navigator.languages）匹配到支持的语言 */
export function matchLocale(langs: readonly string[]): Locale | null {
  for (const raw of langs) {
    const tag = raw.toLowerCase()
    if (tag.startsWith('zh')) return /^zh-(tw|hk|mo|hant)/.test(tag) ? 'zh-TW' : 'zh-CN'
    const base = tag.split('-')[0]
    const hit = locales.find((l) => l.code.toLowerCase() === base)
    if (hit) return hit.code
  }
  return null
}
