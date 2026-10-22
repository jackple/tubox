/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 自托管模型 / wasm 的根地址，如 https://cdn.example.com/tubox */
  readonly VITE_MODEL_BASE?: string
  /** 站点根地址（不含 base），如 https://tubox.example.com；用于 canonical、og:url 与 sitemap.xml */
  readonly VITE_SITE_URL?: string
}
