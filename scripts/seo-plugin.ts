import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Plugin } from 'vite'
import { catalog } from '../src/i18n/catalog'
import { type Locale, defaultLocale, localeMeta, locales, localizePath, splitLocale } from '../src/i18n/locales'
import { absoluteUrl, alternates, fullTitle, ogImage, pagePaths, pageSeo, type PageSeo, structuredData } from '../src/seo'

/**
 * 按语言 × 路由预渲染 SEO：
 * - index.html 中 `<!-- seo:head -->` / `<!-- seo:body -->` 两个占位符替换为对应页面的 meta 与静态正文，并改写 <html lang>
 * - 构建时为每个语言的每个路由输出 dist/<path>.html（如 dist/collage/grid.html、dist/en/collage/grid.html、dist/en.html），
 *   不执行 JS 的爬虫（百度等）也能拿到各页标题与描述
 * - 配置了 VITE_SITE_URL 时额外输出 canonical、og:url、hreflang 与 sitemap.xml
 */
export function seoPlugin(siteUrl: string | undefined): Plugin {
  let base = '/'
  let template = ''

  const seoOf = (locale: Locale, path: string) => pageSeo(catalog[locale], locale, path)

  const render = (html: string, page: PageSeo) =>
    html
      .replace(/<html lang="[^"]*"/, `<html lang="${localeMeta(page.locale).htmlLang}"`)
      .replace('<!-- seo:head -->', renderHead(page))
      .replace('<!-- seo:body -->', renderBody(page))

  function renderHead(page: PageSeo) {
    const title = fullTitle(page)
    const url = absoluteUrl(siteUrl, base, page.href)
    // 社交平台只认绝对地址，没有站点地址时不输出分享图
    const image = absoluteUrl(siteUrl, base, ogImage.href(page.locale))
    const ld = JSON.stringify(structuredData(page, seoOf(page.locale, '/'), siteUrl, base)).replace(/</g, '\\u003c')
    return [
      `<title>${esc(title)}</title>`,
      `<meta name="description" content="${esc(page.description)}" />`,
      `<meta name="keywords" content="${esc(page.keywords.join(','))}" />`,
      url && `<link rel="canonical" href="${esc(url)}" />`,
      ...alternates(siteUrl, base, page.path).map((a) => `<link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}" />`),
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="${esc(page.siteName)}" />`,
      `<meta property="og:locale" content="${localeMeta(page.locale).ogLocale}" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(page.description)}" />`,
      url && `<meta property="og:url" content="${esc(url)}" />`,
      image && `<meta property="og:image" content="${esc(image)}" />`,
      image && `<meta property="og:image:type" content="image/png" />`,
      image && `<meta property="og:image:width" content="${ogImage.width}" />`,
      image && `<meta property="og:image:height" content="${ogImage.height}" />`,
      image && `<meta property="og:image:alt" content="${esc(page.siteName)}" />`,
      `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
      `<meta name="twitter:title" content="${esc(title)}" />`,
      `<meta name="twitter:description" content="${esc(page.description)}" />`,
      image && `<meta name="twitter:image" content="${esc(image)}" />`,
      `<script type="application/ld+json" id="structured-data">${ld}</script>`,
    ]
      .filter(Boolean)
      .join('\n    ')
  }

  // 静态正文：React 挂载时会清空 #root，有 JS 的访客看不到它（见 index.html 的 .seo-static 样式）
  function renderBody(page: PageSeo) {
    const href = (p: string) => base.replace(/\/+$/, '') + p
    const nav = pagePaths
      .map(({ path }) => {
        const p = seoOf(page.locale, path)
        return `<li><a href="${href(p.href)}">${esc(path === '/' ? page.siteName : p.name)}</a></li>`
      })
      .join('')
    const langs = locales
      .map(
        (l) =>
          `<li><a href="${href(localizePath(page.path, l.code))}" hreflang="${l.htmlLang}" lang="${l.htmlLang}">${esc(l.label)}</a></li>`,
      )
      .join('')
    return `<div class="seo-static">
      <h1>${esc(page.path === '/' ? page.siteName : `${page.name} - ${page.siteName}`)}</h1>
      <p>${esc(page.description)}</p>
      <ul>${page.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      <nav><ul>${nav}</ul></nav>
      <nav><ul>${langs}</ul></nav>
    </div>`
  }

  return {
    name: 'tubox:seo',
    configResolved(config) {
      base = config.base
      if (config.command === 'build' && !siteUrl) {
        config.logger.warn('[seo] 未设置 VITE_SITE_URL，将不输出 canonical、og:url、hreflang 与 sitemap.xml')
      }
    },
    transformIndexHtml: {
      // post：拿到 Vite 注入资源标签后的最终 HTML，作为各路由页面的模板
      order: 'post',
      handler(html, ctx) {
        if (ctx.server) {
          const { locale, path } = splitLocale((ctx.originalUrl ?? '/').split(/[?#]/)[0].slice(base.length - 1) || '/')
          return render(html, seoOf(locale, path))
        }
        template = html
        return render(html, seoOf(defaultLocale, '/'))
      },
    },
    writeBundle(options) {
      const outDir = options.dir!
      for (const { code } of locales) {
        for (const { path } of pagePaths) {
          const page = seoOf(code, path)
          if (page.href === '/') continue
          const file = join(outDir, `${page.href}.html`)
          mkdirSync(dirname(file), { recursive: true })
          writeFileSync(file, render(template, page))
        }
      }

      const sitemap = absoluteUrl(siteUrl, base, '/sitemap.xml')
      writeFileSync(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n${sitemap ? `\nSitemap: ${sitemap}\n` : ''}`)
      if (siteUrl) {
        const lastmod = new Date().toISOString().slice(0, 10)
        const urls = locales.flatMap(({ code }) =>
          pagePaths.map(({ path }) => {
            const priority = path === '/' ? '1.0' : '0.8'
            const links = alternates(siteUrl, base, path)
              .map((a) => `\n    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}"/>`)
              .join('')
            const loc = absoluteUrl(siteUrl, base, localizePath(path, code))!
            return `  <url>\n    <loc>${esc(loc)}</loc><lastmod>${lastmod}</lastmod><priority>${priority}</priority>${links}\n  </url>`
          }),
        )
        writeFileSync(
          join(outDir, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`,
        )
      }
    },
  }
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
