import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Plugin } from 'vite'
import { absoluteUrl, fullTitle, pageByPath, pages, type PageSeo, SITE_NAME, structuredData } from '../src/seo'

/**
 * 按路由预渲染 SEO：
 * - index.html 中 `<!-- seo:head -->` / `<!-- seo:body -->` 两个占位符替换为对应页面的 meta 与静态正文
 * - 构建时为每个路由输出 dist/<path>.html（如 dist/collage/grid.html），不执行 JS 的爬虫（百度等）也能拿到各页标题与描述
 * - 配置了 VITE_SITE_URL 时额外输出 canonical、og:url、sitemap.xml
 */
export function seoPlugin(siteUrl: string | undefined): Plugin {
  let base = '/'
  let template = ''

  const render = (html: string, page: PageSeo) =>
    html.replace('<!-- seo:head -->', renderHead(page)).replace('<!-- seo:body -->', renderBody(page))

  function renderHead(page: PageSeo) {
    const title = fullTitle(page)
    const url = absoluteUrl(siteUrl, base, page.path)
    const ld = JSON.stringify(structuredData(page, siteUrl, base)).replace(/</g, '\\u003c')
    return [
      `<title>${esc(title)}</title>`,
      `<meta name="description" content="${esc(page.description)}" />`,
      `<meta name="keywords" content="${esc(page.keywords.join(','))}" />`,
      url && `<link rel="canonical" href="${esc(url)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="${SITE_NAME}" />`,
      `<meta property="og:locale" content="zh_CN" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(page.description)}" />`,
      url && `<meta property="og:url" content="${esc(url)}" />`,
      `<meta name="twitter:card" content="summary" />`,
      `<meta name="twitter:title" content="${esc(title)}" />`,
      `<meta name="twitter:description" content="${esc(page.description)}" />`,
      `<script type="application/ld+json" id="structured-data">${ld}</script>`,
    ]
      .filter(Boolean)
      .join('\n    ')
  }

  // 静态正文：React 挂载时会清空 #root，有 JS 的访客看不到它（见 index.html 的 .seo-static 样式）
  function renderBody(page: PageSeo) {
    const href = (p: string) => base.replace(/\/+$/, '') + p
    const nav = pages.map((p) => `<li><a href="${href(p.path)}">${esc(p.path === '/' ? SITE_NAME : p.name)}</a></li>`).join('')
    return `<div class="seo-static">
      <h1>${esc(page.path === '/' ? SITE_NAME : `${page.name} - ${SITE_NAME}`)}</h1>
      <p>${esc(page.description)}</p>
      <ul>${page.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      <nav><ul>${nav}</ul></nav>
    </div>`
  }

  return {
    name: 'tubox:seo',
    configResolved(config) {
      base = config.base
      if (config.command === 'build' && !siteUrl) {
        config.logger.warn('[seo] 未设置 VITE_SITE_URL，将不输出 canonical、og:url 与 sitemap.xml')
      }
    },
    transformIndexHtml: {
      // post：拿到 Vite 注入资源标签后的最终 HTML，作为各路由页面的模板
      order: 'post',
      handler(html, ctx) {
        if (ctx.server) {
          const path = (ctx.originalUrl ?? '/').split(/[?#]/)[0].slice(base.length - 1)
          return render(html, pageByPath(path))
        }
        template = html
        return render(html, pageByPath('/'))
      },
    },
    writeBundle(options) {
      const outDir = options.dir!
      for (const page of pages) {
        if (page.path === '/') continue
        const file = join(outDir, `${page.path}.html`)
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, render(template, page))
      }

      const sitemap = absoluteUrl(siteUrl, base, '/sitemap.xml')
      writeFileSync(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n${sitemap ? `\nSitemap: ${sitemap}\n` : ''}`)
      if (siteUrl) {
        const lastmod = new Date().toISOString().slice(0, 10)
        const urls = pages
          .map((p) => {
            const priority = p.path === '/' ? '1.0' : '0.8'
            return `  <url><loc>${esc(absoluteUrl(siteUrl, base, p.path)!)}</loc><lastmod>${lastmod}</lastmod><priority>${priority}</priority></url>`
          })
          .join('\n')
        writeFileSync(
          join(outDir, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        )
      }
    },
  }
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
