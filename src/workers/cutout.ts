import * as Comlink from 'comlink'
import { IMGLY_MODEL, imglyAssets } from '@/config'
import { hasOffscreen } from '@/core/canvas'
import { type CutoutStep, type RawMatte, segmentSubject } from '@/core/cutout/matte'
import { firstAvailable } from '@/core/idphoto/vision'
import type { CutoutWorkerApi } from './cutout.worker'

/**
 * 抠图推理放在独立 Worker 中（模型会话常驻，第二张起免加载），避免 WASM 推理阻塞界面；
 * 不支持 OffscreenCanvas 的环境回退主线程。
 */
let remote: Comlink.Remote<CutoutWorkerApi> | null = null
let publicPath: Promise<string> | null = null

export async function segmentInWorker(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  onProgress: (step: CutoutStep, ratio?: number) => void,
): Promise<RawMatte> {
  publicPath ??= firstAvailable(imglyAssets, 'resources.json')
  const o = { publicPath: await publicPath, model: IMGLY_MODEL } as const
  if (!hasOffscreen) return segmentSubject(rgba, width, height, { ...o, onProgress })
  remote ??= Comlink.wrap<CutoutWorkerApi>(
    new Worker(new URL('./cutout.worker.ts', import.meta.url), { type: 'module', name: 'tubox-cutout' }),
  )
  return remote.segment(Comlink.transfer(rgba, [rgba.buffer]), width, height, o, Comlink.proxy(onProgress))
}
