// 生成各语言的社交分享图（og:image / twitter:image，1200×630）到 public/og/<locale>.png，产物提交到仓库。
// 文案取自 src/i18n/messages 的 home / tools，改了这些文案或品牌样式后重新执行。
// 依赖本机 Chrome（headless 截图），CJK 字体用系统字体（macOS 下效果最好）；Chrome 不在默认位置时设置 CHROME_PATH。
// 用法：pnpm og:images
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'public/og')
const WIDTH = 1200
const HEIGHT = 630

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
]

/** 与 src/styles/index.css 中按 lang 选择的 CJK 字体栈一致 */
const CJK_FONTS = {
  'zh-CN': "'PingFang SC', 'HarmonyOS Sans SC', 'Microsoft YaHei', 'Noto Sans SC'",
  'zh-TW': "'PingFang TC', 'Microsoft JhengHei', 'Noto Sans TC'",
  ja: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Noto Sans JP'",
  ko: "'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR'",
}

const TOOL_ORDER = ['batch', 'cutout', 'annotate', 'exif', 'idphoto', 'long', 'grid', 'nine', 'social', 'gif']

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function page(m, meta, logo, fontDir) {
  const h = m.home
  const fonts = `'Geist', ${CJK_FONTS[meta.code] ?? "'PingFang SC'"}, system-ui, sans-serif`
  const chips = TOOL_ORDER.map((k) => `<span class="chip">${esc(m.tools[k].title)}</span>`).join('')
  // 品牌名与 Tubox 不同（如「图盒」）时并排显示，与侧边栏 Logo 一致
  const brand = m.brand.name === 'Tubox' ? 'Tubox' : `${esc(m.brand.name)}<span class="brand-en">Tubox</span>`
  return `<!doctype html>
<html lang="${meta.htmlLang}">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: 'Geist';
    src: url('${fontDir}/geist-latin-wght-normal.woff2') format('woff2');
    font-weight: 100 900;
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215;
  }
  @font-face {
    font-family: 'Geist';
    src: url('${fontDir}/geist-latin-ext-wght-normal.woff2') format('woff2');
    font-weight: 100 900;
    unicode-range: U+0100-024F, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;
  }
  @font-face {
    font-family: 'Geist';
    src: url('${fontDir}/geist-cyrillic-wght-normal.woff2') format('woff2');
    font-weight: 100 900;
    unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    position: relative;
    background: #09090b;
    color: #fafafa;
    font-family: ${fonts};
    -webkit-font-smoothing: antialiased;
  }
  .grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgb(255 255 255 / 0.045) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.045) 1px, transparent 1px);
    background-size: 48px 48px;
    -webkit-mask-image: radial-gradient(ellipse 80% 90% at 70% 30%, #000 20%, transparent 75%);
  }
  .glow { position: absolute; border-radius: 50%; filter: blur(90px); }
  .glow.a { width: 560px; height: 420px; right: -120px; top: -160px; background: rgb(139 141 255 / 0.32); }
  .glow.b { width: 480px; height: 360px; left: -160px; bottom: -200px; background: rgb(192 132 252 / 0.22); }
  .wrap { position: absolute; inset: 0; padding: 64px 72px; display: flex; flex-direction: column; }
  header { display: flex; align-items: center; justify-content: space-between; }
  .logo { display: flex; align-items: center; gap: 18px; font-size: 34px; font-weight: 650; letter-spacing: -0.01em; }
  .logo svg { width: 60px; height: 60px; border-radius: 15px; box-shadow: 0 0 0 1px rgb(255 255 255 / 0.1); }
  .brand-en { margin-left: 12px; color: rgb(150 150 162); font-weight: 500; }
  .domain { font-size: 24px; color: rgb(150 150 162); font-weight: 500; }
  h1 { margin-top: auto; font-size: 76px; line-height: 1.12; font-weight: 700; letter-spacing: -0.03em; }
  h1 > span, p, .chip { white-space: nowrap; }
  h1 > span { display: block; }
  h1 .hl { background: linear-gradient(100deg, #8b8dff, #c084fc); -webkit-background-clip: text; background-clip: text; color: transparent; }
  p { margin-top: 24px; font-size: 28px; line-height: 1.4; color: rgb(170 170 182); }
  .chips { margin-top: 40px; display: flex; flex-wrap: wrap; gap: 0.55em; font-size: 22px; }
  .chip {
    padding: 0.45em 0.9em; border-radius: 999px; font-weight: 500; color: #e4e4e7;
    background: rgb(255 255 255 / 0.05); box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.1);
  }
</style>
</head>
<body>
  <div class="grid"></div>
  <div class="glow a"></div>
  <div class="glow b"></div>
  <div class="wrap">
    <header>
      <div class="logo">${logo}<span>${brand}</span></div>
      <div class="domain">tubox.top</div>
    </header>
    <h1><span>${esc(h.heroLine1)}</span><span>${esc(h.heroBefore)}<span class="hl">${esc(h.heroHighlight)}</span>${esc(h.heroAfter)}</span></h1>
    <p>${esc(h.heroDesc2)}</p>
    <div class="chips">${chips}</div>
  </div>
  <script>
    // 各语言文案长短不一：标题两行、副标题一行、工具标签最多两行，放不下就逐步缩小字号
    const maxWidth = ${WIDTH} - 72 * 2
    const fits = (el) => [el, ...el.children].every((c) => c.scrollWidth <= maxWidth)
    function fit(el, from, to) {
      for (let size = from; size > to && !fits(el); size -= 1) el.style.fontSize = size - 1 + 'px'
    }
    document.fonts.ready.then(() => {
      fit(document.querySelector('h1'), 76, 44)
      fit(document.querySelector('p'), 28, 18)
      const chips = document.querySelector('.chips')
      const rows = () => new Set([...chips.children].map((c) => c.offsetTop)).size
      for (let size = 22; size > 14 && rows() > 2; size -= 1) chips.style.fontSize = size - 1 + 'px'
    })
  </script>
</body>
</html>`
}

async function main() {
  const chrome = CHROME_CANDIDATES.find((p) => p && existsSync(p))
  if (!chrome) throw new Error('未找到 Chrome，请设置 CHROME_PATH')

  // 借 Vite 的 SSR 加载器直接读取 TS 文案，与构建时 seo-plugin 读到的是同一份数据
  const vite = await createServer({ root, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' })
  let catalog, locales
  try {
    ;({ catalog } = await vite.ssrLoadModule('/src/i18n/catalog.ts'))
    ;({ locales } = await vite.ssrLoadModule('/src/i18n/locales.ts'))
  } finally {
    await vite.close()
  }

  const logo = await readFile(resolve(root, 'public/favicon.svg'), 'utf8')
  const fontDir = pathToFileURL(resolve(root, 'node_modules/@fontsource-variable/geist/files')).href
  const tmp = await mkdtemp(join(tmpdir(), 'tubox-og-'))
  await mkdir(outDir, { recursive: true })

  try {
    for (const meta of locales) {
      const html = join(tmp, `${meta.code}.html`)
      const png = join(outDir, `${meta.code}.png`)
      await writeFile(html, page(catalog[meta.code], meta, logo, fontDir))
      await promisify(execFile)(chrome, [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        `--window-size=${WIDTH},${HEIGHT}`,
        // 给 Web 字体留出加载时间
        '--virtual-time-budget=3000',
        `--screenshot=${png}`,
        pathToFileURL(html).href,
      ])
      console.log('✓', png)
    }
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
