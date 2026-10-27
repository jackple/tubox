import type { Ctx2D } from '../canvas'
import type { GifRatio } from './frames'

export interface VideoGifOptions {
  /** 截取片段的起止时间（秒，源视频时间轴） */
  start: number
  end: number
  /** 输出帧率 */
  fps: number
  /** 播放速度倍数，>1 加速 */
  speed: number
  /** 往返播放：正放后倒放回起点 */
  pingpong: boolean
  /** 无限循环；关闭则只播放一次 */
  loop: boolean
  /** 输出宽度（px），高度按比例计算 */
  width: number
  /** auto 保持视频原比例，其余比例居中裁切 */
  ratio: GifRatio
  /** 每帧调色板颜色数，越少体积越小 */
  colors: number
}

export const defaultVideoGifOptions: VideoGifOptions = {
  start: 0,
  end: 0,
  fps: 12,
  speed: 1,
  pingpong: false,
  loop: true,
  width: 480,
  ratio: 'auto',
  colors: 256,
}

export const videoFpsOptions = [5, 8, 10, 12, 15, 20, 25]
export const videoSpeedOptions = [0.5, 1, 1.5, 2, 3]

/** 载入视频时默认截取的时长（秒） */
export const DEFAULT_CLIP = 5
/** 片段时长上下限（秒，源视频时间） */
export const MIN_CLIP = 0.2
export const MAX_CLIP = 30
/** 帧数上限：超过时需缩短片段、降低帧率或加速 */
export const MAX_VIDEO_FRAMES = 600

/** 一帧：取源视频 time 秒处的画面，显示 delay 毫秒 */
export interface VideoGifFrame {
  time: number
  delay: number
}

/** 按片段、帧率与速度生成帧序列 */
export function planVideoFrames(o: Pick<VideoGifOptions, 'start' | 'end' | 'fps' | 'speed' | 'pingpong'>): VideoGifFrame[] {
  const len = o.end - o.start
  if (!(len > 0) || !(o.fps > 0) || !(o.speed > 0)) return []
  const n = Math.max(1, Math.round((len * o.fps) / o.speed))
  const step = len / n
  const order = Array.from({ length: n }, (_, i) => i)
  if (o.pingpong && n > 2) for (let i = n - 2; i > 0; i--) order.push(i)
  // GIF 帧时长精度为 10ms：按累计时间取整后作差，非整除帧率（如 12fps）下总时长也不漂移
  const at = (k: number) => Math.round((k * 100) / o.fps) * 10
  return order.map((i, k) => ({ time: o.start + i * step, delay: at(k + 1) - at(k) }))
}

/** 把源画面（sw×sh）居中裁切铺满 w×h；比例相同时即整幅缩放 */
export function drawCover(ctx: Ctx2D, src: CanvasImageSource, sw: number, sh: number, w: number, h: number) {
  const k = Math.max(w / sw, h / sh)
  const cw = w / k
  const ch = h / k
  ctx.drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, w, h)
}
