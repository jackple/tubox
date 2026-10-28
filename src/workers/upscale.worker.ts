import * as Comlink from 'comlink'
import { type UpscaleAssets, type UpscaleScale, type UpscaleStep, upscalePixels } from '@/core/upscale/upscale'

/** 每次 upscale / cancel 递增，进行中的任务发现编号变化即中止 */
let job = 0

const api = {
  // Comlink 只能代理顶层参数中的函数，进度回调单独传入；结果像素以 transfer 方式回传
  async upscale(
    rgba: Uint8ClampedArray,
    width: number,
    height: number,
    scale: UpscaleScale,
    assets: UpscaleAssets,
    onProgress: (step: UpscaleStep, ratio: number) => void,
  ) {
    const id = ++job
    const res = await upscalePixels(rgba, width, height, scale, assets, onProgress, () => id !== job)
    return Comlink.transfer(res, [res.data.buffer])
  },
  cancel() {
    job++
  },
}

export type UpscaleWorkerApi = typeof api

Comlink.expose(api)
