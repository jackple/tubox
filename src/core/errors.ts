/**
 * 引擎错误码。core/ 不包含界面文案，只抛出错误码（作为 message，可经 Comlink 跨 Worker 传递），
 * 由 UI 层的 errorMessage() 翻译为当前语言，文案见 i18n/messages 的 errors。
 */
export type ErrorCode =
  | 'canvas-unsupported'
  | 'encode-failed'
  | 'heic-unsupported'
  | 'decode-failed'
  | 'model-load-failed'
  | 'segment-failed'
  | 'video-decode-failed'
  | 'upscale-failed'
  | 'qr-too-long'

export const coreError = (code: ErrorCode) => new Error(code)
