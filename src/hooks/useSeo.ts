import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { localeMeta, splitLocale } from '@/i18n/locales'
import { absoluteUrl, alternates, fullTitle, ogImage, pageSeo, structuredData } from '@/seo'
import { useLocale } from '@/stores/locale'

const siteUrl = import.meta.env.VITE_SITE_URL as string | undefined
const base = import.meta.env.BASE_URL

/** 写入或更新 <head> 中的单个标签；value 为空时移除 */
function upsert(selector: string, create: () => HTMLElement, attr: string, value: string | undefined) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!value) return void el?.remove()
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

const meta = (key: 'name' | 'property', name: string, content: string | undefined) =>
  upsert(
    `meta[${key}="${name}"]`,
    () => {
      const m = document.createElement('meta')
      m.setAttribute(key, name)
      return m
    },
    'content',
    content,
  )

/**
 * 站内跳转或切换语言时同步页面 SEO 信息。首屏的同款标签由构建时预渲染进各路由的 HTML（见 scripts/seo-plugin.ts），
 * 这里只负责 SPA 导航后的更新，两边共用 src/seo.ts 的数据。
 */
export function useSeo() {
  const { pathname } = useLocation()
  const loaded = useLocale((s) => s.locale)
  const m = useLocale((s) => s.messages)

  useEffect(() => {
    const { locale, path } = splitLocale(pathname)
    // 语言包切换完成前先不更新，避免写入另一种语言的文案
    if (!m || locale !== loaded) return
    const page = pageSeo(m, locale, path)
    const title = fullTitle(page)
    const url = absoluteUrl(siteUrl, base, page.href)
    const image = absoluteUrl(siteUrl, base, ogImage.href(locale))

    document.title = title
    meta('name', 'description', page.description)
    meta('name', 'keywords', page.keywords.join(','))
    meta('property', 'og:site_name', page.siteName)
    meta('property', 'og:locale', localeMeta(locale).ogLocale)
    meta('property', 'og:title', title)
    meta('property', 'og:description', page.description)
    meta('property', 'og:url', url)
    meta('property', 'og:image', image)
    meta('property', 'og:image:alt', image && page.siteName)
    meta('name', 'twitter:title', title)
    meta('name', 'twitter:description', page.description)
    meta('name', 'twitter:image', image)
    upsert(
      'link[rel="canonical"]',
      () => {
        const l = document.createElement('link')
        l.rel = 'canonical'
        return l
      },
      'href',
      url,
    )

    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove())
    for (const a of alternates(siteUrl, base, page.path)) {
      const l = document.createElement('link')
      l.rel = 'alternate'
      l.hreflang = a.hreflang
      l.href = a.href
      document.head.appendChild(l)
    }

    let ld = document.getElementById('structured-data')
    if (!ld) {
      ld = document.createElement('script')
      ld.id = 'structured-data'
      ld.setAttribute('type', 'application/ld+json')
      document.head.appendChild(ld)
    }
    ld.textContent = JSON.stringify(structuredData(page, pageSeo(m, locale, '/'), siteUrl, base))
  }, [pathname, loaded, m])
}
