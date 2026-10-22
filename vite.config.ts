import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

// 包的 exports 未暴露 package.json，直接读文件拿版本号，用于拼接 CDN 回退地址
const mediapipeVersion: string = JSON.parse(
  readFileSync(new URL('./node_modules/@mediapipe/tasks-vision/package.json', import.meta.url), 'utf8'),
).version

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  define: {
    __MEDIAPIPE_VERSION__: JSON.stringify(mediapipeVersion),
  },
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
})
