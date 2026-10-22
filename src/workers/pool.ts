import * as Comlink from 'comlink'
import { hasOffscreen } from '@/core/canvas'
import { processImage } from '@/core/batch/process'
import type { BatchOptions, ProcessMeta, ProcessResult } from '@/core/batch/types'
import { type ImageProbe, probeImage } from '@/core/thumbnail'
import type { BatchWorkerApi } from './batch.worker'

type Remote = Comlink.Remote<BatchWorkerApi>

/**
 * 轻量 Worker 池：按 CPU 核数并行，任务排队领取空闲 Worker。
 * 不支持 OffscreenCanvas 的环境自动回退主线程。
 */
class WorkerPool {
  private idle: Remote[] = []
  private waiting: ((w: Remote) => void)[] = []
  private started = false
  readonly size = Math.max(1, Math.min(6, (navigator.hardwareConcurrency || 4) - 1))

  private boot() {
    if (this.started) return
    this.started = true
    for (let i = 0; i < this.size; i++) {
      const worker = new Worker(new URL('./batch.worker.ts', import.meta.url), { type: 'module', name: `tubox-${i}` })
      this.idle.push(Comlink.wrap<BatchWorkerApi>(worker))
    }
  }

  private acquire(): Promise<Remote> {
    this.boot()
    const w = this.idle.pop()
    return w ? Promise.resolve(w) : new Promise((r) => this.waiting.push(r))
  }

  private release(w: Remote) {
    const next = this.waiting.shift()
    if (next) next(w)
    else this.idle.push(w)
  }

  async run<T>(task: (w: Remote) => Promise<T>): Promise<T> {
    const w = await this.acquire()
    try {
      return await task(w)
    } finally {
      this.release(w)
    }
  }
}

let pool: WorkerPool | null = null

export function processInPool(file: Blob, options: BatchOptions, meta: ProcessMeta): Promise<ProcessResult> {
  if (!hasOffscreen) return processImage(file, options, meta)
  pool ??= new WorkerPool()
  return pool.run((w) => w.process(file, options, meta))
}

/** 读取尺寸并生成缩略图，与批量处理共用 Worker 池（顺带限制并发解码，防止一次拖入大量图片时内存暴涨） */
export function probeInPool(file: Blob): Promise<ImageProbe> {
  if (!hasOffscreen) return probeImage(file)
  pool ??= new WorkerPool()
  return pool.run((w) => w.probe(file))
}
