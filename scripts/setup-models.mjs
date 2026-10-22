// 将 MediaPipe 的 wasm 与模型文件落地到 public/，实现完全自托管（国内网络 / 离线部署友好）。
// 用法：pnpm setup:models
import { cp, mkdir, writeFile, access, readFile, rm } from 'node:fs/promises'
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

const exists = (p) => access(p).then(() => true, () => false)

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
}

main()
