// 从线上 sitemap 读取 URL 并提交给 IndexNow。
// 用法：pnpm seo:indexnow
// 前提：public/c7b220da8ffdf33faf03e09f455610cf.txt 已部署到站点根目录。
const SITE_URL = (process.env.INDEXNOW_SITE_URL || 'https://tubox.top').replace(/\/+$/, '')
const HOST = new URL(SITE_URL).host
const KEY = 'c7b220da8ffdf33faf03e09f455610cf'
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`

const response = await fetch(SITEMAP_URL)
if (!response.ok) throw new Error(`读取 sitemap 失败：${response.status} ${response.statusText}`)
const xml = await response.text()
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
if (urls.length === 0) throw new Error('sitemap 中没有找到 URL')

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: urls,
}
const result = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
})

if (!result.ok) {
  const body = await result.text()
  throw new Error(`IndexNow 提交失败：${result.status} ${result.statusText}\n${body}`)
}
console.log(`✓ IndexNow 已接收 ${urls.length} 个 URL（HTTP ${result.status}）`)
