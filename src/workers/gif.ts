import * as Comlink from 'comlink'
import type { GifEncodeOptions } from '@/core/gif/encode'
import type { GifWorkerApi } from './gif.worker'

interface GifFrameData {
  rgba: Uint8ClampedArray
  delay: number
}

/**
 * GIF 编码（颜色量化最耗时）放在独立 Worker 中：主线程绘制下一帧的同时 Worker 编码上一帧，
 * 帧像素以 transfer 方式传入，不在主线程堆积。render 可以是异步的（视频需先 seek 到对应时间）。
 */
export async function encodeGifInWorker(
  width: number,
  height: number,
  o: GifEncodeOptions,
  count: number,
  render: (i: number) => GifFrameData | Promise<GifFrameData>,
  onProgress: (ratio: number) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  const worker = new Worker(new URL('./gif.worker.ts', import.meta.url), { type: 'module', name: 'tubox-gif' })
  const remote = Comlink.wrap<GifWorkerApi>(worker)
  try {
    await remote.begin(width, height, o)
    let pending: Promise<void> = Promise.resolve()
    for (let i = 0; i < count; i++) {
      signal?.throwIfAborted()
      const { rgba, delay } = await render(i)
      await pending
      onProgress(i / count)
      pending = remote.add(Comlink.transfer(rgba, [rgba.buffer]), delay)
    }
    await pending
    signal?.throwIfAborted()
    onProgress(1)
    const bytes = await remote.finish()
    return new Blob([bytes], { type: 'image/gif' })
  } finally {
    remote[Comlink.releaseProxy]()
    worker.terminate()
  }
}
