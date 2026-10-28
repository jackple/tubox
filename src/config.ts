declare const __MEDIAPIPE_VERSION__: string
declare const __IMGLY_VERSION__: string

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

/**
 * 通用抠图（@imgly/background-removal）的资源目录：resources.json + 分块的 ONNX 模型与 onnxruntime wasm。
 * 必须是以 / 结尾的绝对地址；自托管目录带版本号，与库版本严格对应。
 */
export const imglyAssets = [
  custom && `${custom}/imgly/${__IMGLY_VERSION__}/`,
  `${base}/imgly/${__IMGLY_VERSION__}/`,
  `https://staticimgly.com/@imgly/background-removal-data/${__IMGLY_VERSION__}/dist/`,
]
  .filter(Boolean)
  .map((u) => new URL(u as string, location.href).href)

/**
 * AI 高清放大模型：Real-ESRGAN realesr-general-x4v3（SRVGGNetCompact，BSD-3-Clause）的 ONNX 导出版，fp32 约 4.9MB，
 * 输入输出均为 float32 NCHW，宽高可变。CDN 地址固定到提交，避免上游改动；onnxruntime 的 wasm 复用抠图的 imgly 资源（imglyAssets）。
 */
export const UPSCALE_MODEL = 'realesr-general-x4v3.onnx'
export const upscaleModel = [
  custom && `${custom}/${UPSCALE_MODEL}`,
  `${base}/models/${UPSCALE_MODEL}`,
  'https://huggingface.co/vlad-grig/realesr-general-x4v3-onnx/resolve/0e95d93e454cf6b5de9bdf5a1c9e7ec340d38231/onnx/model.onnx',
]
  .filter(Boolean)
  .map((u) => new URL(u as string, location.href).href)

/** 抠图模型：isnet_fp16 约 84MB，精度与体积的折中（另有 isnet_quint8 约 42MB / isnet 约 167MB） */
export const IMGLY_MODEL = 'isnet_fp16'

/**
 * 本站源代码地址（AGPL-3.0 第 13 条：通过网络向用户提供服务时须提供对应源代码）。
 * 部署修改版时请通过 VITE_SOURCE_URL 指向你自己的源码仓库。
 */
export const SOURCE_URL = (import.meta.env.VITE_SOURCE_URL as string | undefined) || 'https://github.com/jackple/tubox'

/** 第三方许可证清单，构建时由 scripts/licenses-plugin.ts 生成 */
export const THIRD_PARTY_LICENSES_URL = `${base}/third-party-licenses.txt`

/** 证件照工作分辨率（长边），兼顾分割精度与速度 */
export const ID_PHOTO_WORKING_SIZE = 1600
