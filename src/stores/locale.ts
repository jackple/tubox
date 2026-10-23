import { create } from 'zustand'
import { type Locale, defaultLocale, isLocale, localeMeta, localizePath, matchLocale, splitLocale } from '@/i18n/locales'
import type { Messages } from '@/i18n/messages/zh-CN'

// 每种语言单独拆包，按需加载
const loaders = import.meta.glob<{ default: Messages }>('../i18n/messages/*.ts')
const load = (l: Locale) => loaders[`../i18n/messages/${l}.ts`]().then((m) => m.default)

const KEY = 'tubox-locale'

/** 用户在语言菜单中的显式选择 */
export function savePreference(l: Locale) {
  try {
    localStorage.setItem(KEY, l)
  } catch {
    /* 隐私模式等场景忽略 */
  }
}

function readPreference(): Locale | null {
  try {
    const v = localStorage.getItem(KEY)
    return isLocale(v) ? v : null
  } catch {
    return null
  }
}

interface LocaleState {
  locale: Locale
  /** 当前语言文案；首屏渲染前由 initLocale 加载 */
  messages: Messages | null
  setLocale: (l: Locale) => Promise<void>
}

let pending: Locale | null = null

export const useLocale = create<LocaleState>((set, get) => ({
  locale: defaultLocale,
  messages: null,
  setLocale: async (l) => {
    pending = l
    if (get().messages && get().locale === l) return
    const messages = await load(l)
    // 快速连续切换时只保留最后一次
    if (pending !== l) return
    document.documentElement.lang = localeMeta(l).htmlLang
    set({ locale: l, messages })
  },
}))

const BOT = /bot|crawl|spider|slurp|lighthouse|headless/i

/**
 * 首屏前确定语言：URL 带语言前缀时以 URL 为准；
 * 否则（默认语言地址）按「用户偏好 → 浏览器语言」跳到对应语言地址。爬虫不跳转，保证各语言页面都能被收录。
 */
export async function initLocale() {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '')
  const { pathname, search, hash } = window.location
  const inner = pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname
  let { locale, path } = splitLocale(inner)

  if (locale === defaultLocale) {
    // 浏览器语言都不支持时（如意大利语）用英文，比默认的中文更可能看懂
    const preferred =
      readPreference() ?? (BOT.test(navigator.userAgent) ? null : (matchLocale(navigator.languages ?? [navigator.language]) ?? 'en'))
    if (preferred && preferred !== defaultLocale) {
      locale = preferred
      history.replaceState(history.state, '', base + localizePath(path, locale) + search + hash)
    }
  }
  await useLocale.getState().setLocale(locale)
}
