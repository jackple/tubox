/**
 * 各页面 SEO 信息：标题、描述、关键词、结构化数据、多语言 alternate。
 * 纯数据 + 纯函数，不依赖 React / import.meta.env —— 同时被运行时（useSeo）和构建时（scripts/seo-plugin.ts 预渲染每个语言 × 路由的 HTML）使用。
 * 文案在 i18n/messages 的 seo 中。只能用相对路径导入。
 */
import { type Locale, defaultLocale, localeMeta, locales, localizePath } from './i18n/locales'
import type { Messages } from './i18n/messages/zh-CN'

type PageKey = keyof Messages['seo']

/** 路由路径（不含 base 与语言前缀），与 App.tsx 的路由一致 */
export const pagePaths: { path: string; key: PageKey }[] = [
  { path: '/', key: 'home' },
  { path: '/batch', key: 'batch' },
  { path: '/id-photo', key: 'idphoto' },
  { path: '/collage/long', key: 'long' },
  { path: '/collage/grid', key: 'grid' },
  { path: '/collage/nine', key: 'nine' },
  { path: '/collage/social', key: 'social' },
]

export interface PageSeo {
  locale: Locale
  /** 不含语言前缀的路由路径 */
  path: string
  /** 带语言前缀的实际地址 */
  href: string
  siteName: string
  /** 页面名，用于面包屑和静态导航 */
  name: string
  /** <title>，不含站点名后缀 */
  title: string
  description: string
  keywords: string[]
  /** 预渲染到静态 HTML 中的功能要点，供不执行 JS 的爬虫（如百度）读取 */
  features: string[]
}

/** 未知路径回退到首页 */
export function pageSeo(m: Messages, locale: Locale, path: string): PageSeo {
  const p = pagePaths.find((x) => x.path === path) ?? pagePaths[0]
  return { ...m.seo[p.key], locale, path: p.path, href: localizePath(p.path, locale), siteName: m.brand.site }
}

export const fullTitle = (page: PageSeo) => (page.path === '/' ? `${page.siteName} · ${page.title}` : `${page.title} - ${page.siteName}`)

/** 拼接绝对地址；siteUrl 为空时返回 undefined（不输出 canonical / og:url / hreflang） */
export function absoluteUrl(siteUrl: string | undefined, base: string, href: string) {
  if (!siteUrl) return undefined
  const b = base.replace(/\/+$/, '')
  return siteUrl.replace(/\/+$/, '') + b + (href === '/' ? '/' : href)
}

/** 同一页面的各语言版本（hreflang），x-default 指向默认语言 */
export function alternates(siteUrl: string | undefined, base: string, path: string): { hreflang: string; href: string }[] {
  if (!siteUrl) return []
  const list = locales.map((l) => ({ hreflang: l.htmlLang, href: absoluteUrl(siteUrl, base, localizePath(path, l.code))! }))
  return [...list, { hreflang: 'x-default', href: absoluteUrl(siteUrl, base, localizePath(path, defaultLocale))! }]
}

/** JSON-LD 结构化数据：首页为 WebSite，工具页为 WebApplication + 面包屑 */
export function structuredData(page: PageSeo, home: PageSeo, siteUrl: string | undefined, base: string) {
  const url = absoluteUrl(siteUrl, base, page.href)
  const homeUrl = absoluteUrl(siteUrl, base, home.href)
  const inLanguage = localeMeta(page.locale).htmlLang
  if (page.path === '/') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: page.siteName,
      description: page.description,
      inLanguage,
      ...(url && { url }),
    }
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: `${page.name} - ${page.siteName}`,
        description: page.description,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        browserRequirements: 'Requires JavaScript',
        inLanguage,
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
        featureList: page.features,
        ...(url && { url }),
      },
      ...(url && homeUrl
        ? [
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: page.siteName, item: homeUrl },
                { '@type': 'ListItem', position: 2, name: page.name, item: url },
              ],
            },
          ]
        : []),
    ],
  }
}
