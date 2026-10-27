// gifenc 未自带类型声明，这里只声明用到的部分
declare module 'gifenc' {
  export type PaletteFormat = 'rgb565' | 'rgb444' | 'rgba4444'
  export type Palette = number[][]

  export interface WriteFrameOptions {
    palette?: Palette
    /** 毫秒，内部换算为 1/100 秒 */
    delay?: number
    /** -1 只播放一次，0 无限循环，>0 循环次数；仅首帧生效 */
    repeat?: number
    transparent?: boolean
    transparentIndex?: number
    dispose?: number
  }

  export interface Encoder {
    writeFrame(index: Uint8Array, width: number, height: number, opts?: WriteFrameOptions): void
    finish(): void
    bytes(): Uint8Array
    bytesView(): Uint8Array
  }

  export function GIFEncoder(opts?: { auto?: boolean; initialCapacity?: number }): Encoder
  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, opts?: { format?: PaletteFormat }): Palette
  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: Palette, format?: PaletteFormat): Uint8Array
}
