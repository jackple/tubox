import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { type GuideLocale, type GuidePage, guideAlternates, guideIndexPath, guidePath, guides } from '../src/guides'
import { absoluteUrl } from '../src/seo'

const copy = {
  en: {
    guideHome: 'Tubox guides',
    tools: 'Image tools',
    home: 'Tubox home',
    updated: 'Updated',
    related: 'Related tools',
    faq: 'Frequently asked',
    open: 'Open the free tool',
    privacy: 'Selected images stay in your browser. The app, fonts and model files still load over the network.',
    all: 'Practical image workflows and browser-based tools.',
  },
  'zh-CN': {
    guideHome: '图盒教程',
    tools: '图片工具',
    home: '图盒首页',
    updated: '更新于',
    related: '相关工具',
    faq: '常见问题',
    open: '打开免费工具',
    privacy: '选中的图片在浏览器中处理；应用、字体和模型文件仍需从网络下载。',
    all: '实用的图片处理流程与浏览器工具。',
  },
}

const esc = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function style() {
  return `
  :root { color-scheme: light dark; --bg:#f7f7fa; --panel:#fff; --fg:#16161d; --muted:#6c6c79; --line:#e6e6eb; --brand:#7157d9; }
  @media (prefers-color-scheme: dark) { :root { --bg:#09090b; --panel:#121217; --fg:#f5f5f7; --muted:#9b9ba6; --line:#282830; --brand:#b7a4ff; } }
  * { box-sizing:border-box } html { background:var(--bg); color:var(--fg); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif; }
  body { margin:0; line-height:1.7 } a { color:var(--brand); text-underline-offset:3px } .wrap { width:min(900px,calc(100% - 36px)); margin:auto }
  header { border-bottom:1px solid var(--line); background:color-mix(in srgb,var(--panel) 92%,transparent); }
  nav { display:flex; align-items:center; justify-content:space-between; gap:18px; min-height:64px; font-size:14px }
  .brand { color:var(--fg); font-weight:700; text-decoration:none } .links { display:flex; gap:18px; flex-wrap:wrap }
  main { padding:64px 0 80px } .eyebrow { color:var(--brand); font-size:13px; font-weight:700; letter-spacing:.1em; text-transform:uppercase }
  h1 { max-width:780px; margin:14px 0 18px; font-size:clamp(38px,7vw,66px); line-height:1.06; letter-spacing:-.045em }
  .lede { max-width:720px; color:var(--muted); font-size:19px } .meta { color:var(--muted); font-size:13px; margin-top:22px }
  .cta { display:inline-block; margin:30px 0 52px; padding:13px 19px; border-radius:11px; background:var(--fg); color:var(--bg); font-weight:700; text-decoration:none }
  article section { padding:26px 0; border-top:1px solid var(--line) } h2 { margin:0 0 12px; font-size:28px; letter-spacing:-.025em } h3 { margin:22px 0 8px; font-size:18px }
  p { margin:0 0 14px } ol,ul { padding-left:24px } li { margin:8px 0 }
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:14px; margin-top:30px }
  .card { display:block; padding:22px; border:1px solid var(--line); border-radius:15px; background:var(--panel); color:var(--fg); text-decoration:none }
  .card span { display:block; margin-top:8px; color:var(--muted); font-size:14px } .faq { padding:17px 0; border-bottom:1px solid var(--line) }
  .faq strong { display:block; margin-bottom:5px } .note { padding:18px 20px; border-left:4px solid var(--brand); background:var(--panel); color:var(--muted) }
  footer { padding:30px 0 50px; border-top:1px solid var(--line); color:var(--muted); font-size:13px }
  @media (max-width:640px) { main { padding-top:42px } .links { gap:10px; font-size:13px } .wrap { width:min(100% - 24px,900px) } }
  `
}

function shell(locale: GuideLocale, title: string, description: string, body: string, canonical?: string, alternates: { lang: string; href?: string }[] = []) {
  const t = copy[locale]
  const home = locale === 'en' ? '/en' : '/'
  const guidesHome = guideIndexPath[locale]
  return `<!doctype html>
<html lang="${locale === 'en' ? 'en' : 'zh-CN'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
  ${alternates.filter((item) => item.href).map((item) => `<link rel="alternate" hreflang="${item.lang}" href="${esc(item.href!)}">`).join('\n  ')}
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  ${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ''}
  <style>${style()}</style>
</head>
<body>
  <header><div class="wrap"><nav><a class="brand" href="${home}">Tubox</a><div class="links"><a href="${guidesHome}">${t.guideHome}</a><a href="${home}">${t.home}</a></div></nav></div></header>
  <main class="wrap">${body}</main>
  <footer><div class="wrap">${esc(t.privacy)}</div></footer>
</body>
</html>`
}

function renderGuide(page: GuidePage, siteUrl: string | undefined, base: string) {
  const t = copy[page.locale]
  const path = guidePath(page)
  const canonical = absoluteUrl(siteUrl, base, path)
  const alternates = guideAlternates(page).map((alt) => ({ lang: alt.lang, href: absoluteUrl(siteUrl, base, alt.href) }))
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HowTo',
        name: page.h1,
        description: page.description,
        step: page.sections.flatMap((section) =>
          (section.steps ?? []).map((text, index) => ({ '@type': 'HowToStep', position: index + 1, name: text, text })),
        ),
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
      ...(canonical
        ? [{ '@type': 'Article', headline: page.title, description: page.description, inLanguage: page.locale === 'en' ? 'en' : 'zh-CN', dateModified: page.updated, mainEntityOfPage: canonical }]
        : []),
    ],
  }
  return shell(page.locale, page.title, page.description, `
    <div class="eyebrow">Tubox guide</div>
    <h1>${esc(page.h1)}</h1>
    <p class="lede">${esc(page.intro)}</p>
    <p class="meta">${t.updated} ${page.updated}</p>
    <a class="cta" href="${page.toolPath}">${esc(page.toolLabel)}</a>
    <article>${page.sections
      .map(
        (section) => `<section><h2>${esc(section.heading)}</h2>${(section.paragraphs ?? []).map((p) => `<p>${esc(p)}</p>`).join('')}${
          section.steps ? `<ol>${section.steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>` : ''
        }</section>`,
      )
      .join('')}</article>
    <section><h2>${t.related}</h2><div class="cards">${page.related
      .map((item) => `<a class="card" href="${item.path}"><b>${esc(item.label)}</b><span>Open tool →</span></a>`)
      .join('')}</div></section>
    <section><h2>${t.faq}</h2>${page.faqs
      .map((faq) => `<div class="faq"><strong>${esc(faq.question)}</strong><span>${esc(faq.answer)}</span></div>`)
      .join('')}</section>
    <p class="note">${esc(t.privacy)}</p>
    <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
  `, canonical, alternates)
}

function renderIndex(locale: GuideLocale, siteUrl: string | undefined, base: string) {
  const t = copy[locale]
  const path = guideIndexPath[locale]
  const canonical = absoluteUrl(siteUrl, base, path)
  const list = guides.filter((guide) => guide.locale === locale)
  const title = locale === 'en' ? 'Tubox Image Guides' : '图盒图片处理教程'
  return shell(locale, title, t.all, `
    <div class="eyebrow">Tubox guides</div>
    <h1>${title}</h1>
    <p class="lede">${esc(t.all)}</p>
    <div class="cards">${list
      .map((guide) => `<a class="card" href="${guidePath(guide)}"><b>${esc(guide.h1)}</b><span>${esc(guide.description)}</span></a>`)
      .join('')}</div>
  `, canonical, [])
}

export function writeGuidePages(outDir: string, siteUrl: string | undefined, base: string) {
  for (const locale of ['zh-CN', 'en'] as const) {
    const indexPath = guideIndexPath[locale]
    const indexFile = join(outDir, indexPath.replace(/^\//, ''), 'index.html')
    mkdirSync(dirname(indexFile), { recursive: true })
    writeFileSync(indexFile, renderIndex(locale, siteUrl, base))
  }
  for (const page of guides) {
    const path = guidePath(page)
    const file = join(outDir, path.replace(/^\//, ''), 'index.html')
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, renderGuide(page, siteUrl, base))
  }
}
