declare const __MEDIAPIPE_VERSION__: string

const base = import.meta.env.BASE_URL.replace(/\/$/, '')
const cdn = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${__MEDIAPIPE_VERSION__}/wasm`

/**
 * 端侧 AI 资源，按顺序尝试：本地自托管（pnpm setup:models 生成）→ 远程 CDN。
 * 可通过 VITE_MODEL_BASE 指向自己的 OSS / CDN。
 */
const custom = import.meta.env.VITE_MODEL_BASE as string | undefined

export const visionAssets = {
  wasm: [custom && `${custom}/wasm`, `${base}/mediapipe/${__MEDIAPIPE_VERSION__}/wasm`, cdn].filter(Boolean) as string[],
  segmenter: [
    custom && `${custom}/selfie_multiclass_256x256.tflite`,
    `${base}/models/selfie_multiclass_256x256.tflite`,
    'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
  ].filter(Boolean) as string[],
  face: [
    custom && `${custom}/blaze_face_short_range.tflite`,
    `${base}/models/blaze_face_short_range.tflite`,
    'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite',
  ].filter(Boolean) as string[],
}

/** 证件照工作分辨率（长边），兼顾分割精度与速度 */
export const ID_PHOTO_WORKING_SIZE = 1600
