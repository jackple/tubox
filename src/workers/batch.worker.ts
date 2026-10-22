import * as Comlink from 'comlink'
import { processImage } from '@/core/batch/process'
import { probeImage } from '@/core/thumbnail'

const api = {
  process: processImage,
  probe: probeImage,
}

export type BatchWorkerApi = typeof api

Comlink.expose(api)
