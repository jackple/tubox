import { GIFEncoder, applyPalette, quantize } from 'gifenc'

export interface GifEncodeOptions {
  /** 每帧调色板颜色数（2-256） */
  colors: number
  /** 无限循环；false 只播放一次 */
  loop: boolean
}

export interface GifWriter {
  add: (rgba: Uint8ClampedArray, delay: number) => void
  finish: () => Uint8Array
}

/** 逐帧写入的 GIF 编码器：每帧单独量化调色板（局部颜色表），画质优于全局调色板 */
export function createGifWriter(width: number, height: number, o: GifEncodeOptions): GifWriter {
  const gif = GIFEncoder()
  const colors = Math.max(2, Math.min(256, Math.round(o.colors)))
  return {
    add: (rgba, delay) => {
      const palette = quantize(rgba, colors)
      const index = applyPalette(rgba, palette)
      gif.writeFrame(index, width, height, { palette, delay, repeat: o.loop ? 0 : -1 })
    },
    finish: () => {
      gif.finish()
      return gif.bytes()
    },
  }
}
