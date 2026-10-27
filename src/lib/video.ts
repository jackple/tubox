import { coreError } from '@/core/errors'
import { uid } from './format'

export interface VideoAsset {
  id: string
  name: string
  file: File
  url: string
  width: number
  height: number
  /** 时长（秒） */
  duration: number
}

export const VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime,video/x-m4v,video/ogg,.mp4,.webm,.mov,.m4v,.mkv,.ogv'

export const isVideoFile = (f: File) => f.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|mkv|ogv)$/i.test(f.name)

/** 单次 seek 的超时：超过即视为浏览器无法解码 */
const SEEK_TIMEOUT = 10_000

/** 执行 run 后等待 events 中任一事件；出错或超时则视为无法解码 */
function once(v: HTMLVideoElement, events: (keyof HTMLMediaElementEventMap)[], run: () => void) {
  return new Promise<void>((resolve, reject) => {
    const done = () => {
      clearTimeout(timer)
      for (const e of events) v.removeEventListener(e, onOk)
      v.removeEventListener('error', onError)
    }
    const onOk = () => (done(), resolve())
    const onError = () => (done(), reject(coreError('video-decode-failed')))
    const timer = setTimeout(onError, SEEK_TIMEOUT)
    for (const e of events) v.addEventListener(e, onOk)
    v.addEventListener('error', onError)
    run()
  })
}

/** 跳到 t 秒，等待该帧可绘制 */
export const seekVideo = (v: HTMLVideoElement, t: number) =>
  once(v, ['seeked'], () => {
    v.currentTime = t
  })

/** 创建静音、内联播放的 video 元素并等待元数据（尺寸、时长）就绪 */
export async function openVideo(url: string): Promise<HTMLVideoElement> {
  const v = document.createElement('video')
  v.muted = true
  v.playsInline = true
  v.preload = 'auto'
  try {
    await once(v, ['loadedmetadata'], () => {
      v.src = url
    })
    // 只有音轨或编码不受支持时没有画面尺寸
    if (!v.videoWidth || !v.videoHeight) throw coreError('video-decode-failed')
    // MediaRecorder 录制的 WebM 常缺少时长，需跳到末尾让浏览器算出
    if (!Number.isFinite(v.duration)) {
      await once(v, ['durationchange', 'seeked'], () => {
        v.currentTime = Number.MAX_SAFE_INTEGER
      })
      if (!Number.isFinite(v.duration)) throw coreError('video-decode-failed')
    }
    await seekVideo(v, 0)
    return v
  } catch (e) {
    closeVideo(v)
    throw e
  }
}

/** 释放解码器（object URL 由 VideoAsset 持有，不在这里回收） */
export function closeVideo(v: HTMLVideoElement) {
  v.pause()
  v.removeAttribute('src')
  v.load()
}

export async function loadVideo(file: File): Promise<VideoAsset> {
  const url = URL.createObjectURL(file)
  try {
    const v = await openVideo(url)
    const asset = { id: uid(), name: file.name, file, url, width: v.videoWidth, height: v.videoHeight, duration: v.duration }
    closeVideo(v)
    return asset
  } catch (e) {
    URL.revokeObjectURL(url)
    throw e
  }
}

export const disposeVideo = (a: VideoAsset) => URL.revokeObjectURL(a.url)
