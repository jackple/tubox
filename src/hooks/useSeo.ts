import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { absoluteUrl, fullTitle, pageByPath, structuredData } from '@/seo'

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
 * 站内跳转时同步页面 SEO 信息。首屏的同款标签由构建时预渲染进各路由的 HTML（见 vite.config.ts），
 * 这里只负责 SPA 导航后的更新，两边共用 src/seo.ts 的数据。
 */
export function useSeo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const page = pageByPath(pathname)
    const title = fullTitle(page)
    const url = absoluteUrl(siteUrl, base, page.path)

    document.title = title
    meta('name', 'description', page.description)
    meta('name', 'keywords', page.keywords.join(','))
    meta('property', 'og:title', title)
    meta('property', 'og:description', page.description)
    meta('property', 'og:url', url)
    meta('name', 'twitter:title', title)
    meta('name', 'twitter:description', page.description)
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

    let ld = document.getElementById('structured-data')
    if (!ld) {
      ld = document.createElement('script')
      ld.id = 'structured-data'
      ld.setAttribute('type', 'application/ld+json')
      document.head.appendChild(ld)
    }
    ld.textContent = JSON.stringify(structuredData(page, siteUrl, base))
  }, [pathname])
}
