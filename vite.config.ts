import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { licensesPlugin } from './scripts/licenses-plugin'
import { seoPlugin } from './scripts/seo-plugin'

// 包的 exports 未暴露 package.json，直接读文件拿版本号，用于拼接自托管目录与 CDN 回退地址
const pkgVersion = (name: string): string =>
  JSON.parse(readFileSync(new URL(`./node_modules/${name}/package.json`, import.meta.url), 'utf8')).version

export default defineConfig(({ mode }) => {
  const licenses = licensesPlugin()
  return {
    plugins: [react(), seoPlugin(loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL || undefined), licenses.main],
    resolve: {
      alias: [
        { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
        // @imgly/background-removal 会把 onnxruntime 的 glue mjs 与 wasm 以 blob URL 传入（env.wasm.wasmPaths），
        // 改用非 bundle 版本，避免 Vite 额外打包一份 24MB 用不到的 wasm
        {
          find: /^onnxruntime-web$/,
          replacement: fileURLToPath(new URL('./node_modules/onnxruntime-web/dist/ort.wasm.min.mjs', import.meta.url)),
        },
        {
          find: /^onnxruntime-web\/webgpu$/,
          replacement: fileURLToPath(new URL('./node_modules/onnxruntime-web/dist/ort.webgpu.min.mjs', import.meta.url)),
        },
      ],
    },
    define: {
      __MEDIAPIPE_VERSION__: JSON.stringify(pkgVersion('@mediapipe/tasks-vision')),
      __IMGLY_VERSION__: JSON.stringify(pkgVersion('@imgly/background-removal')),
    },
    worker: { format: 'es', plugins: () => [licenses.worker] },
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 1200,
    },
  }
})
