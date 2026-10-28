import * as Comlink from 'comlink'
import { imglyAssets, upscaleModel } from '@/config'
import { firstAvailable } from '@/core/idphoto/vision'
import type { UpscaleResult, UpscaleScale, UpscaleStep } from '@/core/upscale/upscale'
import type { UpscaleWorkerApi } from './upscale.worker'

/**
 * 放大推理放在独立 Worker 中（模型会话常驻，第二张起免加载），逐块推理不阻塞界面。
 * 引擎只做像素运算、不依赖 OffscreenCanvas，因此不需要主线程回退。
 */
let remote: Comlink.Remote<UpscaleWorkerApi> | null = null
let ortPath: Promise<string> | null = null

export async function upscaleInWorker(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  scale: UpscaleScale,
  onProgress: (step: UpscaleStep, ratio: number) => void,
): Promise<UpscaleResult> {
  // onnxruntime 的 wasm 复用抠图的 imgly 资源目录
  ortPath ??= firstAvailable(imglyAssets, 'resources.json')
  const assets = { ortPath: await ortPath, model: upscaleModel }
  remote ??= Comlink.wrap<UpscaleWorkerApi>(
    new Worker(new URL('./upscale.worker.ts', import.meta.url), { type: 'module', name: 'tubox-upscale' }),
  )
  return remote.upscale(Comlink.transfer(rgba, [rgba.buffer]), width, height, scale, assets, Comlink.proxy(onProgress))
}

/** 中止进行中的放大（在下一块推理前生效） */
export function cancelUpscale() {
  void remote?.cancel()
}
