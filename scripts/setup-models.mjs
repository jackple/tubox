// 将 MediaPipe 的 wasm 与模型、@imgly/background-removal 的 ONNX 模型与 onnxruntime wasm 落地到 public/，
// 实现完全自托管（国内网络 / 离线部署友好）。
// 用法：pnpm setup:models
import { cp, mkdir, writeFile, access, readFile, readdir, rm, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pub = resolve(root, 'public')

const MODELS = {
  'selfie_multiclass_256x256.tflite':
    'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
  'blaze_face_short_range.tflite':
    'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite',
}

// 通用抠图只下载实际用到的模型（与 src/config.ts 的 IMGLY_MODEL 保持一致）及 WASM / WebGPU 两套 onnxruntime
const IMGLY_KEYS = [
  '/models/isnet_fp16',
  '/onnxruntime-web/ort-wasm-simd-threaded.wasm',
  '/onnxruntime-web/ort-wasm-simd-threaded.mjs',
  '/onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm',
  '/onnxruntime-web/ort-wasm-simd-threaded.jsep.mjs',
]

const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  )

async function fetchBuffer(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

/** imgly 资源按 4MB 分块存放，resources.json 记录每个资源由哪些块组成；全部块就绪后才写 resources.json */
async function setupImgly() {
  const { version } = JSON.parse(await readFile(resolve(root, 'node_modules/@imgly/background-removal/package.json'), 'utf8'))
  const cdn = `https://staticimgly.com/@imgly/background-removal-data/${version}/dist/`
  const base = resolve(pub, 'imgly')
  const dst = resolve(base, version)
  // 目录带版本号，清理旧版本
  for (const d of await readdir(base).catch(() => [])) if (d !== version) await rm(resolve(base, d), { recursive: true, force: true })
  await mkdir(dst, { recursive: true })

  const all = JSON.parse((await fetchBuffer(cdn + 'resources.json')).toString())
  const subset = {}
  const chunks = []
  for (const key of IMGLY_KEYS) {
    if (!all[key]) throw new Error(`resources.json 中没有 ${key}`)
    subset[key] = all[key]
    for (const c of all[key].chunks) chunks.push({ name: c.name, size: c.offsets[1] - c.offsets[0] })
  }

  const missing = []
  for (const c of chunks) {
    const file = resolve(dst, c.name)
    if (!(await exists(file)) || (await stat(file)).size !== c.size) missing.push(c)
  }
  if (!missing.length) {
    await writeFile(resolve(dst, 'resources.json'), JSON.stringify(subset))
    console.log('• skip   imgly', version)
    return
  }

  await rm(resolve(dst, 'resources.json'), { force: true })
  const total = missing.reduce((n, c) => n + c.size, 0)
  console.log(`↓ fetch  imgly ${version}：${missing.length} 个分块，约 ${Math.round(total / 1048576)}MB`)
  let next = 0
  const worker = async () => {
    while (next < missing.length) {
      const c = missing[next++]
      const buf = await fetchBuffer(cdn + c.name)
      if (buf.length !== c.size) throw new Error(`${c.name} 大小不符`)
      await writeFile(resolve(dst, c.name), buf)
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
  await writeFile(resolve(dst, 'resources.json'), JSON.stringify(subset))
  console.log('✓ imgly  ->', dst)
}

async function main() {
  const pkgDir = resolve(root, 'node_modules/@mediapipe/tasks-vision')
  const { version } = JSON.parse(await readFile(resolve(pkgDir, 'package.json'), 'utf8'))
  const wasmSrc = resolve(pkgDir, 'wasm')
  // 目录带版本号：升级 MediaPipe 后路径随之变化，wasm 可以放心长缓存
  const wasmDst = resolve(pub, 'mediapipe', version, 'wasm')
  await rm(resolve(pub, 'mediapipe'), { recursive: true, force: true })
  await mkdir(wasmDst, { recursive: true })
  await cp(wasmSrc, wasmDst, { recursive: true })
  console.log('✓ wasm  ->', wasmDst)

  const modelDir = resolve(pub, 'models')
  await mkdir(modelDir, { recursive: true })
  for (const [name, url] of Object.entries(MODELS)) {
    const dst = resolve(modelDir, name)
    if (await exists(dst)) {
      console.log('• skip  ', name)
      continue
    }
    process.stdout.write(`↓ fetch  ${name} ... `)
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await writeFile(dst, Buffer.from(await res.arrayBuffer()))
      console.log('ok')
    } catch (e) {
      console.log('failed:', e.message)
      console.log(`  请手动下载 ${url}\n  并放到 ${dst}`)
    }
  }

  try {
    await setupImgly()
  } catch (e) {
    // 不中断构建：运行时会回退到 staticimgly.com CDN
    console.log('✗ imgly  下载失败:', e.message, '（运行时将回退到 CDN）')
  }
}

main()
