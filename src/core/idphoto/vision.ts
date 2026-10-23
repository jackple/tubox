import type { FaceDetector, ImageSegmenter } from '@mediapipe/tasks-vision'
import { visionAssets } from '@/config'

/**
 * MediaPipe 端侧模型加载器：按需动态 import，模型 / wasm 优先读取本地自托管文件，
 * 不存在时回退到 CDN。GPU 委托失败自动降级 CPU。
 */

/** 依次探测候选地址，返回第一个可用的；都不可用时返回最后一个（通常是 CDN） */
export async function firstAvailable(candidates: string[], probe: string): Promise<string> {
  for (const url of candidates) {
    try {
      const res = await fetch(url + probe, { method: 'HEAD' })
      // Vite 开发服务器对不存在的文件会回退 index.html，因此要排除 text/html
      if (res.ok && !(res.headers.get('content-type') ?? '').includes('text/html')) return url
    } catch {
      /* try next */
    }
  }
  return candidates[candidates.length - 1]
}

/** 依次直接下载模型，首个成功的即返回，省去 HEAD 探测的额外请求 */
async function fetchFirst(candidates: string[]): Promise<Uint8Array> {
  let lastError: unknown
  for (const url of candidates) {
    try {
      const res = await fetch(url)
      if (res.ok && !(res.headers.get('content-type') ?? '').includes('text/html')) return new Uint8Array(await res.arrayBuffer())
      lastError = new Error(`HTTP ${res.status}: ${url}`)
    } catch (e) {
      lastError = e
    }
  }
  throw lastError
}

let filesetPromise: ReturnType<typeof loadFileset> | null = null
async function loadFileset() {
  const { FilesetResolver } = await import('@mediapipe/tasks-vision')
  const base = await firstAvailable(visionAssets.wasm, '/vision_wasm_internal.js')
  return FilesetResolver.forVisionTasks(base)
}
const fileset = () => (filesetPromise ??= loadFileset().catch((e) => ((filesetPromise = null), Promise.reject(e))))

async function withDelegate<T>(create: (delegate: 'GPU' | 'CPU') => Promise<T>): Promise<T> {
  try {
    return await create('GPU')
  } catch {
    return create('CPU')
  }
}

let segmenterPromise: Promise<ImageSegmenter> | null = null
export function getSegmenter(): Promise<ImageSegmenter> {
  segmenterPromise ??= (async () => {
    const [{ ImageSegmenter }, fs, model] = await Promise.all([
      import('@mediapipe/tasks-vision'),
      fileset(),
      fetchFirst(visionAssets.segmenter),
    ])
    return withDelegate((delegate) =>
      ImageSegmenter.createFromOptions(fs, {
        baseOptions: { modelAssetBuffer: model, delegate },
        runningMode: 'IMAGE',
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      }),
    )
  })().catch((e) => ((segmenterPromise = null), Promise.reject(e)))
  return segmenterPromise
}

let facePromise: Promise<FaceDetector> | null = null
export function getFaceDetector(): Promise<FaceDetector> {
  facePromise ??= (async () => {
    const [{ FaceDetector }, fs, model] = await Promise.all([import('@mediapipe/tasks-vision'), fileset(), fetchFirst(visionAssets.face)])
    return withDelegate((delegate) =>
      FaceDetector.createFromOptions(fs, {
        baseOptions: { modelAssetBuffer: model, delegate },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.5,
      }),
    )
  })().catch((e) => ((facePromise = null), Promise.reject(e)))
  return facePromise
}
