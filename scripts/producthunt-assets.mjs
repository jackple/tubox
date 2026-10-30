// 生成 Product Hunt 产品画廊（1270×760）到 marketing/assets/producthunt/。
// 依赖本机 Chrome；图片是可直接上传的 PNG，HTML 中间文件只用于 headless 截图。
// 用法：pnpm marketing:ph
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'marketing/assets/producthunt')
const WIDTH = 1270
const HEIGHT = 760

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
]

const baseStyles = `
  @font-face {
    font-family: 'Geist';
    src: url('__FONT__') format('woff2');
    font-weight: 100 900;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    background: #09090b;
    color: #fafafa;
    font-family: 'Geist', 'PingFang SC', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .slide { position: relative; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgb(255 255 255 / .045) 1px, transparent 1px),
      linear-gradient(90deg, rgb(255 255 255 / .045) 1px, transparent 1px);
    background-size: 46px 46px;
    -webkit-mask-image: radial-gradient(ellipse 70% 90% at 58% 20%, #000 10%, transparent 76%);
  }
  .glow { position: absolute; border-radius: 999px; filter: blur(110px); }
  .glow-a { width: 620px; height: 480px; right: -160px; top: -160px; background: rgb(124 58 237 / .32); }
  .glow-b { width: 480px; height: 400px; left: -180px; bottom: -240px; background: rgb(34 211 238 / .16); }
  .topbar {
    position: absolute; inset: 0 0 auto; height: 92px; padding: 0 64px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid rgb(255 255 255 / .08);
  }
  .brand { display: flex; align-items: center; gap: 14px; font-size: 24px; font-weight: 650; letter-spacing: -.02em; }
  .logo {
    display: grid; place-items: center; width: 42px; height: 42px; border-radius: 12px;
    background: #fafafa; color: #09090b; font-size: 31px; font-weight: 800;
    box-shadow: 0 0 0 1px rgb(255 255 255 / .18), 0 12px 30px rgb(0 0 0 / .35);
  }
  .domain { font-size: 18px; color: #8d8d99; letter-spacing: -.01em; }
  .eyebrow {
    display: inline-flex; align-items: center; gap: 9px; padding: 8px 12px;
    border: 1px solid rgb(255 255 255 / .1); border-radius: 999px;
    background: rgb(255 255 255 / .05); color: #c4b5fd;
    font-size: 13px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase;
  }
  .dot { width: 7px; height: 7px; border-radius: 999px; background: #a78bfa; box-shadow: 0 0 14px #a78bfa; }
  h1 { font-size: 68px; line-height: .98; letter-spacing: -.055em; font-weight: 720; }
  .accent { color: #bca7ff; }
  .muted { color: #9c9ca8; }
  .mono { font-family: 'SFMono-Regular', 'Geist Mono', ui-monospace, monospace; }
`

function hero() {
  const tools = [
    ['Batch', 'Compress · resize · convert'],
    ['Cutout', 'Remove backgrounds locally'],
    ['Upscale', '2× / 4× with AI'],
    ['ID Photo', '30+ passport specs'],
    ['Collage', 'Grids · long images · social'],
    ['EXIF', 'View and remove metadata'],
  ]
  return `
  <div class="slide hero">
    <div class="grid"></div><div class="glow glow-a"></div><div class="glow glow-b"></div>
    <div class="topbar">
      <div class="brand"><span class="logo">t</span>Tubox</div>
      <div class="domain">tubox.top</div>
    </div>
    <main class="hero-main">
      <div class="hero-copy">
        <span class="eyebrow"><i class="dot"></i> Privacy-first image toolkit</span>
        <h1>13 image tools.<br><span class="accent">Zero uploads.</span></h1>
        <p>Compress, remove backgrounds, make ID photos and more — right in your browser.</p>
        <div class="proof"><span>NO SIGN-UP</span><span>WEBGPU + WASM</span><span>AGPL-3.0</span></div>
      </div>
      <div class="browser">
        <div class="browser-bar"><i></i><i></i><i></i><span>tubox.top/en</span></div>
        <div class="browser-body">
          <aside><b>T</b><i class="active"></i><i></i><i></i><i></i><i></i></aside>
          <section>
            <div class="app-kicker">YOUR WORKSPACE</div>
            <div class="app-title">Everything,<br>without the upload.</div>
            <div class="tool-grid">
              ${tools.map(([name, detail], i) => `<div class="tool ${i === 0 ? 'selected' : ''}"><span>0${i + 1}</span><b>${name}</b><small>${detail}</small></div>`).join('')}
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>`
}

function workflow() {
  const steps = [
    ['01', 'Clean up', 'Batch compress to a target size and strip private metadata.'],
    ['02', 'Make it fit', 'Remove the background, resize, crop or build the right layout.'],
    ['03', 'Export', 'Download the original-resolution result — no account required.'],
  ]
  return `
  <div class="slide workflow">
    <div class="grid"></div><div class="glow glow-a"></div>
    <div class="topbar"><div class="brand"><span class="logo">t</span>Tubox</div><div class="domain">One browser tab. Your whole workflow.</div></div>
    <main class="workflow-main">
      <section class="workflow-copy">
        <span class="eyebrow"><i class="dot"></i> Built for real work</span>
        <h1>One tab.<br><span class="accent">Start to export.</span></h1>
        <p>No installs, upload queues or subscription wall between you and the finished image.</p>
        <div class="steps">
          ${steps.map(([n, title, detail]) => `<div class="step"><b>${n}</b><div><strong>${title}</strong><span>${detail}</span></div></div>`).join('')}
        </div>
      </section>
      <section class="queue-card">
        <div class="queue-head"><span>Batch processing</span><b>12 files</b></div>
        <div class="target"><div><small>TARGET MAX SIZE</small><strong>≤ 200 KB</strong></div><span>JPG · WebP</span></div>
        <div class="files">
          ${['hero-product-01.jpg', 'hero-product-02.jpg', 'hero-product-03.jpg', 'hero-product-04.jpg'].map((n, i) => `<div><i>${String(i + 1).padStart(2, '0')}</i><span>${n}</span><b>${[186, 198, 174, 192][i]} KB</b><em>Done</em></div>`).join('')}
        </div>
        <div class="queue-foot"><span>Processed on this device</span><button>Download ZIP</button></div>
        <div class="privacy-note"><i></i> Your files never left this browser</div>
      </section>
    </main>
  </div>`
}

function privacy() {
  return `
  <div class="slide privacy">
    <div class="grid"></div>
    <div class="glow privacy-glow"></div>
    <div class="topbar"><div class="brand"><span class="logo">t</span>Tubox</div><div class="domain">Local by design</div></div>
    <main class="privacy-main">
      <section class="privacy-copy">
        <span class="eyebrow"><i class="dot"></i> Your files stay with you</span>
        <h1>Your images<br><span class="accent">never leave this device.</span></h1>
        <p>Decode, compress, AI cutout and upscaling run inside your browser. There is no image-upload endpoint.</p>
        <div class="privacy-pills"><span>No upload queue</span><span>No account</span><span>No image storage</span></div>
      </section>
      <section class="device">
        <div class="device-top"><span>Private browser sandbox</span><b>ON DEVICE</b></div>
        <div class="device-flow">
          <div class="node"><span class="node-icon">IMG</span><b>Your image</b><small>Stays local</small></div>
          <div class="arrow">→</div>
          <div class="node strong"><span class="node-icon">CPU</span><b>Browser engine</b><small>Canvas · Worker · AI</small></div>
          <div class="arrow">→</div>
          <div class="node"><span class="node-icon">OUT</span><b>Your export</b><small>Saved locally</small></div>
        </div>
        <div class="device-boundary">Only the static app and model files are downloaded.</div>
      </section>
    </main>
  </div>`
}

function idPhoto() {
  return `
  <div class="slide idphoto">
    <div class="grid"></div><div class="glow id-glow"></div>
    <div class="topbar"><div class="brand"><span class="logo">t</span>Tubox</div><div class="domain">Passport & ID photos</div></div>
    <main class="id-main">
      <section class="id-copy">
        <span class="eyebrow"><i class="dot"></i> No photo booth required</span>
        <h1>From a phone photo<br><span class="accent">to a print-ready ID.</span></h1>
        <p>30+ passport and visa specs, automatic framing, background replacement and a print sheet at 300 DPI.</p>
        <div class="id-stats"><div><b>30+</b><span>photo specs</span></div><div><b>6"</b><span>print sheet</span></div><div><b>300</b><span>DPI export</span></div></div>
      </section>
      <section class="photo-stage">
        <div class="source-card"><small>PHONE PHOTO</small><div class="portrait"></div><span>Original</span></div>
        <div class="flow-mark">→</div>
        <div class="result-card">
          <div class="result-head"><span>US Passport</span><b>2 × 2 in</b></div>
          <div class="sheet"><div class="id-shot"><div class="head"></div><div class="body"></div></div><div class="id-shot"><div class="head"></div><div class="body"></div></div><div class="id-shot"><div class="head"></div><div class="body"></div></div><div class="id-shot"><div class="head"></div><div class="body"></div></div></div>
          <div class="result-foot"><span>Auto framed · white background</span><b>Export</b></div>
        </div>
      </section>
    </main>
  </div>`
}

const slideStyles = `
  .hero-main { position: absolute; inset: 92px 0 0; display: grid; grid-template-columns: 1.02fr 1fr; gap: 56px; padding: 62px 64px 64px; }
  .hero-copy { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; }
  .hero-copy h1 { margin-top: 22px; }
  .hero-copy p { max-width: 510px; margin-top: 24px; color: #aaaab4; font-size: 21px; line-height: 1.45; letter-spacing: -.02em; }
  .proof { display: flex; gap: 9px; margin-top: 34px; }
  .proof span { padding: 7px 10px; border: 1px solid rgb(255 255 255 / .1); border-radius: 7px; background: rgb(255 255 255 / .045); color: #b9b9c2; font-size: 11px; font-weight: 650; letter-spacing: .075em; }
  .browser { align-self: center; height: 520px; border: 1px solid rgb(255 255 255 / .12); border-radius: 20px; overflow: hidden; background: #111116; box-shadow: 0 32px 90px rgb(0 0 0 / .45), inset 0 1px rgb(255 255 255 / .05); transform: perspective(1200px) rotateY(-3deg); }
  .browser-bar { height: 42px; display: flex; align-items: center; gap: 7px; padding: 0 15px; border-bottom: 1px solid rgb(255 255 255 / .08); background: #17171d; }
  .browser-bar i { width: 8px; height: 8px; border-radius: 99px; background: #3f3f48; }
  .browser-bar span { margin-left: 10px; padding: 5px 13px; border-radius: 6px; background: #0f0f14; color: #777783; font-size: 10px; }
  .browser-body { display: grid; grid-template-columns: 54px 1fr; height: 478px; }
  .browser-body aside { display: flex; flex-direction: column; align-items: center; gap: 18px; padding-top: 16px; border-right: 1px solid rgb(255 255 255 / .08); }
  .browser-body aside b { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; background: #f5f5f7; color: #111; font-size: 19px; }
  .browser-body aside i { width: 21px; height: 21px; border-radius: 6px; border: 1px solid #3b3b44; }
  .browser-body aside i.active { border-color: #9d7bff; background: rgb(139 92 246 / .2); box-shadow: 0 0 18px rgb(139 92 246 / .25); }
  .browser-body section { padding: 28px 24px; min-width: 0; background: radial-gradient(circle at 80% 0, rgb(139 92 246 / .13), transparent 42%); }
  .app-kicker { color: #8f8f9d; font-size: 9px; letter-spacing: .14em; font-weight: 700; }
  .app-title { margin-top: 8px; font-size: 29px; line-height: 1.06; letter-spacing: -.045em; font-weight: 680; }
  .tool-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 24px; }
  .tool { min-height: 112px; padding: 12px 11px; border: 1px solid rgb(255 255 255 / .08); border-radius: 10px; background: rgb(255 255 255 / .025); }
  .tool.selected { border-color: rgb(167 139 250 / .55); background: rgb(139 92 246 / .11); }
  .tool span { display: block; color: #6f6f7b; font-size: 8px; }
  .tool b { display: block; margin-top: 19px; font-size: 13px; font-weight: 620; }
  .tool small { display: block; margin-top: 4px; color: #777783; font-size: 8px; line-height: 1.35; }
  .workflow-main, .privacy-main, .id-main { position: absolute; inset: 92px 0 0; display: grid; grid-template-columns: .9fr 1.1fr; gap: 54px; padding: 56px 64px; align-items: center; }
  .workflow-copy h1, .privacy-copy h1, .id-copy h1 { margin-top: 17px; font-size: 55px; line-height: 1.01; }
  .workflow-copy > p, .privacy-copy > p, .id-copy > p { margin-top: 18px; max-width: 500px; color: #a4a4ae; font-size: 17px; line-height: 1.5; }
  .steps { display: grid; gap: 8px; margin-top: 24px; }
  .step { display: grid; grid-template-columns: 37px 1fr; gap: 12px; align-items: start; padding: 13px; border: 1px solid rgb(255 255 255 / .08); border-radius: 10px; background: rgb(255 255 255 / .035); }
  .step > b { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 8px; background: #a78bfa; color: #15101f; font-size: 11px; }
  .step strong { display: block; font-size: 15px; }
  .step span { display: block; margin-top: 3px; color: #898994; font-size: 12px; line-height: 1.35; }
  .queue-card { padding: 25px; border: 1px solid rgb(255 255 255 / .12); border-radius: 20px; background: #121217; box-shadow: 0 30px 80px rgb(0 0 0 / .35); }
  .queue-head, .queue-foot { display: flex; align-items: center; justify-content: space-between; }
  .queue-head { padding-bottom: 18px; font-size: 18px; font-weight: 600; }
  .queue-head b { padding: 5px 9px; border-radius: 6px; background: rgb(255 255 255 / .06); color: #a7a7b1; font-size: 11px; }
  .target { display: flex; align-items: center; justify-content: space-between; padding: 18px; border: 1px solid rgb(167 139 250 / .35); border-radius: 12px; background: rgb(139 92 246 / .09); }
  .target small { color: #a49bbd; font-size: 9px; letter-spacing: .1em; }
  .target strong { display: block; margin-top: 4px; font-size: 27px; }
  .target > span { color: #8b8b96; font-size: 11px; }
  .files { display: grid; gap: 6px; margin-top: 15px; }
  .files > div { display: grid; grid-template-columns: 27px 1fr 62px 44px; align-items: center; gap: 9px; min-height: 47px; padding: 0 11px; border: 1px solid rgb(255 255 255 / .07); border-radius: 8px; background: rgb(255 255 255 / .025); font-size: 11px; }
  .files i { color: #6f6f7b; font-style: normal; }
  .files b { color: #aaaab4; font-size: 10px; font-weight: 500; text-align: right; }
  .files em { color: #6ee7b7; font-size: 9px; font-style: normal; text-align: right; }
  .queue-foot { margin-top: 16px; }
  .queue-foot span { color: #8a8a95; font-size: 10px; }
  .queue-foot button { padding: 11px 16px; border: 0; border-radius: 7px; background: #fafafa; color: #111; font-weight: 650; font-size: 11px; }
  .privacy-note { margin-top: 12px; padding: 10px 12px; border-radius: 8px; background: rgb(45 212 191 / .08); color: #87e8d6; font-size: 10px; }
  .privacy-note i { display: inline-block; width: 6px; height: 6px; margin-right: 7px; border-radius: 99px; background: #2dd4bf; }
  .privacy-glow { width: 620px; height: 520px; right: -120px; top: 70px; background: rgb(45 212 191 / .17); }
  .privacy-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; }
  .privacy-pills span { padding: 9px 12px; border: 1px solid rgb(45 212 191 / .25); border-radius: 99px; background: rgb(45 212 191 / .07); color: #a4f4e6; font-size: 12px; }
  .device { padding: 28px; border: 1px solid rgb(94 234 212 / .23); border-radius: 22px; background: linear-gradient(145deg, rgb(12 32 31 / .95), rgb(10 20 25 / .95)); box-shadow: 0 30px 90px rgb(0 0 0 / .38); }
  .device-top { display: flex; justify-content: space-between; align-items: center; padding-bottom: 22px; border-bottom: 1px solid rgb(255 255 255 / .08); font-size: 13px; }
  .device-top b { color: #5eead4; font-size: 10px; letter-spacing: .12em; }
  .device-flow { display: grid; grid-template-columns: 1fr 35px 1fr 35px 1fr; align-items: center; margin-top: 34px; }
  .node { display: flex; min-height: 176px; flex-direction: column; align-items: center; justify-content: center; border: 1px solid rgb(255 255 255 / .1); border-radius: 15px; background: rgb(255 255 255 / .035); }
  .node.strong { border-color: rgb(94 234 212 / .45); background: rgb(94 234 212 / .07); }
  .node-icon { display: grid; place-items: center; width: 50px; height: 50px; margin-bottom: 16px; border-radius: 13px; background: rgb(255 255 255 / .07); color: #d7fff8; font-size: 10px; font-weight: 750; letter-spacing: .06em; }
  .node b { font-size: 14px; }
  .node small { margin-top: 6px; color: #7f9b98; font-size: 10px; }
  .arrow { text-align: center; color: #5eead4; font-size: 23px; }
  .device-boundary { margin-top: 24px; padding: 14px; border: 1px dashed rgb(94 234 212 / .2); border-radius: 10px; color: #8ba9a5; font-size: 11px; text-align: center; }
  .id-glow { width: 620px; height: 520px; right: -150px; top: 60px; background: rgb(192 132 252 / .2); }
  .id-stats { display: flex; gap: 12px; margin-top: 28px; }
  .id-stats div { width: 110px; padding: 14px; border: 1px solid rgb(255 255 255 / .1); border-radius: 11px; background: rgb(255 255 255 / .035); }
  .id-stats b { display: block; font-size: 25px; }
  .id-stats span { display: block; margin-top: 3px; color: #81818c; font-size: 10px; }
  .photo-stage { display: grid; grid-template-columns: .72fr 40px 1.28fr; align-items: center; }
  .source-card, .result-card { padding: 20px; border: 1px solid rgb(255 255 255 / .12); border-radius: 18px; background: #131318; box-shadow: 0 30px 80px rgb(0 0 0 / .35); }
  .source-card small, .result-head b { color: #8d8d98; font-size: 9px; letter-spacing: .09em; }
  .source-card > span { display: block; margin-top: 13px; color: #898994; font-size: 11px; text-align: center; }
  .portrait { position: relative; height: 315px; margin-top: 12px; overflow: hidden; background: linear-gradient(150deg, #392f49, #18151d); }
  .portrait:before { content: ''; position: absolute; width: 128px; height: 150px; left: 78px; top: 52px; border-radius: 60px 60px 46px 46px; background: #b9a3a1; }
  .portrait:after { content: ''; position: absolute; width: 245px; height: 150px; left: 20px; top: 190px; border-radius: 115px 115px 0 0; background: #26222b; }
  .flow-mark { color: #c4b5fd; text-align: center; font-size: 25px; }
  .result-head, .result-foot { display: flex; align-items: center; justify-content: space-between; }
  .result-head { padding-bottom: 14px; font-size: 14px; font-weight: 600; }
  .sheet { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 17px; background: #e7e7e7; }
  .id-shot { position: relative; height: 168px; overflow: hidden; background: #f7f7f8; border: 3px solid white; box-shadow: 0 0 0 1px #bdbdbd; }
  .head { position: absolute; width: 50px; height: 62px; left: 50%; top: 28px; transform: translateX(-50%); border-radius: 24px 24px 17px 17px; background: #ae9898; }
  .body { position: absolute; width: 98px; height: 83px; left: 50%; top: 89px; transform: translateX(-50%); border-radius: 45px 45px 0 0; background: #2a2634; }
  .result-foot { margin-top: 14px; font-size: 10px; }
  .result-foot span { color: #898994; }
  .result-foot b { padding: 9px 14px; border-radius: 7px; background: #fafafa; color: #111; }
`

function page(fontHref, content) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>${baseStyles.replace('__FONT__', fontHref)}${slideStyles}</style>
</head>
<body>${content}</body>
</html>`
}

async function main() {
  const chrome = CHROME_CANDIDATES.find((p) => p && existsSync(p))
  if (!chrome) throw new Error('未找到 Chrome，请设置 CHROME_PATH')

  const fontPath = pathToFileURL(resolve(root, 'node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2')).href
  const slides = [
    ['ph-01-hero', hero()],
    ['ph-02-workflow', workflow()],
    ['ph-03-privacy', privacy()],
    ['ph-04-id-photo', idPhoto()],
  ]
  const tmp = await mkdtemp(join(tmpdir(), 'tubox-ph-'))
  await mkdir(outDir, { recursive: true })

  try {
    for (const [name, content] of slides) {
      const html = join(tmp, `${name}.html`)
      const png = join(outDir, `${name}.png`)
      await writeFile(html, page(fontPath, content))
      await promisify(execFile)(chrome, [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        `--window-size=${WIDTH},${HEIGHT}`,
        '--virtual-time-budget=2500',
        `--screenshot=${png}`,
        pathToFileURL(html).href,
      ])
      console.log('✓', png)
    }
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
