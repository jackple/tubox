import * as Comlink from 'comlink'
import { processImage } from '@/core/batch/process'

const api = {
  process: processImage,
}

export type BatchWorkerApi = typeof api

Comlink.expose(api)
