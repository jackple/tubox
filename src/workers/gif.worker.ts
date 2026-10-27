import * as Comlink from 'comlink'
import { type GifEncodeOptions, type GifWriter, createGifWriter } from '@/core/gif/encode'

// 每次导出新建一个 Worker，编码器状态保存在模块内
let writer: GifWriter | null = null

const api = {
  begin(width: number, height: number, o: GifEncodeOptions) {
    writer = createGifWriter(width, height, o)
  },
  add(rgba: Uint8ClampedArray, delay: number) {
    writer!.add(rgba, delay)
  },
  finish() {
    const bytes = writer!.finish()
    writer = null
    return Comlink.transfer(bytes, [bytes.buffer as ArrayBuffer])
  },
}

export type GifWorkerApi = typeof api

Comlink.expose(api)
