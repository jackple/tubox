import * as Comlink from 'comlink'
import { type CutoutStep, type SegmentOptions, segmentSubject } from '@/core/cutout/matte'

const api = {
  // Comlink 只能代理顶层参数中的函数，进度回调单独传入；概率图以 transfer 方式回传
  async segment(
    rgba: Uint8ClampedArray,
    width: number,
    height: number,
    o: Omit<SegmentOptions, 'onProgress'>,
    onProgress: (step: CutoutStep, ratio?: number) => void,
  ) {
    const raw = await segmentSubject(rgba, width, height, { ...o, onProgress })
    return Comlink.transfer(raw, [raw.prob.buffer])
  },
}

export type CutoutWorkerApi = typeof api

Comlink.expose(api)
