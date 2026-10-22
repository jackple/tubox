/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 自托管模型 / wasm 的根地址，如 https://cdn.example.com/tubox */
  readonly VITE_MODEL_BASE?: string
}
