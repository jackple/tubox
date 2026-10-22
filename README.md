# 图盒 Tubox

纯前端图片处理工具箱，所有处理都在浏览器本地完成，图片不会上传。

| 模块 | 能力 |
| --- | --- |
| **批量处理** | 统一尺寸（长边 / 适应 / 裁切填充 / 拉伸 / 固定宽高 / 百分比）、质量压缩、**按目标体积压缩**、文字 / Logo 水印（九宫格定位、斜向平铺防盗）、格式转换（JPG / PNG / WebP / AVIF）、文件名模板、ZIP 打包 |
| **证件照** | 20+ 规格（一寸二寸、身份证、护照、美 / 申根 / 日 / 韩 / 英 / 加 / 澳签证、国考 / 教资 / 四六级等）、端侧 AI 人像分割换底、人脸定位自动构图与歪头纠正、调色、规格合规检测、体积达标、冲印排版（6 寸 / 5 寸 / A4，带裁切线，写入 300 DPI） |
| **长图拼接** | 竖向 / 横向、电影字幕拼接、间距 / 边距 / 圆角 / 背景，超出浏览器画布上限自动缩放 |
| **自由拼图** | 18 种模板（2-9 张），6 种画布比例，按图片数量自动推荐模板 |
| **九宫格切图** | 九宫格 / 四宫格 / 六宫格 / 横竖三连，拖拽取景，朋友圈间隙预览，一键打包 |
| **社交排版** | 小红书 / 朋友圈 / 视频号 / 微博 / 公众号封面；6 种版式 × 6 套配色 × 2 种字体 |

## 快速开始

```bash
pnpm install
pnpm setup:models   # 可选：把 MediaPipe wasm 与模型下载到 public/，实现完全自托管
pnpm dev
```

不执行 `setup:models` 也能运行：证件照会回退到 jsDelivr / Google Storage 加载模型（国内网络可能较慢）。
也可以设置 `VITE_MODEL_BASE=https://your-cdn/tubox`，从自己的 CDN 加载。

```bash
pnpm build      # 类型检查 + 打包到 dist/
```

### 部署

使用 History 路由（`/batch`、`/collage/grid`），静态托管需要把未知路径回退到 `index.html`，否则直接访问或刷新子页面会 404：

- **Nginx**：`location / { try_files $uri $uri/ /index.html; }`
- **Vercel**：`vercel.json` → `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
- **Netlify / Cloudflare Pages**：`public/_redirects` → `/*  /index.html  200`
- **部署在子路径**：`pnpm build --base=/tubox/`，路由 basename 会自动跟随

`pnpm dev` / `pnpm preview` 已内置回退，本地无需配置。

## 技术栈

Vite 6 · React 19 · TypeScript · Tailwind CSS 3 · Zustand · Framer Motion · Comlink（Web Worker）· MediaPipe Tasks Vision · JSZip · Geist 字体

## 架构

```
src/
├── core/                  # 图像引擎：纯 TS，不依赖 React，主线程与 Worker 通用
│   ├── canvas.ts          #   OffscreenCanvas / <canvas> 抽象、解码、高质量逐级缩放、特性检测
│   ├── encode.ts          #   编码 + 目标体积（质量二分 → 逐步缩图）、JPEG DPI 写入
│   ├── batch/             #   批量管线：resize → watermark → encode → rename
│   ├── scene/             #   声明式场景图 + 渲染器（图片 / 矩形 / 文字图层，渐变、圆角、阴影、模糊、旋转、中英文换行）
│   ├── collage/           #   长图 / 拼图模板 / 九宫格 / 社交版式 —— 只负责「生成场景」
│   └── idphoto/           #   规格库、MediaPipe 加载、人像分析、构图合成、冲印排版
├── workers/               # Worker 池（按 CPU 核数并行，不支持 OffscreenCanvas 时回退主线程）
├── stores/                # Zustand：每个工具一个 store，切换页面状态不丢失
├── components/
│   ├── icons/             #   工具专属双色图标（墨色描边 + 品牌色强调）
│   ├── ui/                #   设计系统：Button / Segmented / Slider / Switch / Section / ColorSwatches…
│   ├── layout/            #   AppShell / Sidebar / ToolLayout（标题栏 + 素材栏 + 舞台 + 检查器）
│   └── common/            #   Dropzone / CompareSlider / ScenePreview / SceneThumb / ImageStrip
├── features/              # 页面：home / batch / idphoto / collage
├── hooks/  lib/           # 通用 hooks 与工具函数
└── config.ts              # 模型与 wasm 地址（本地优先，CDN 回退）
```

### 关键设计

- **引擎与 UI 分离**：`core/` 全部是纯函数，可以单测，也可以直接搬到 Node（配合 `@napi-rs/canvas`）或 Worker。
- **场景图**：所有排版类工具输出同一种 `Scene`，同一个渲染器负责预览（按显示尺寸 × DPR 渲染）和导出（原始分辨率），新增模板只需写一个 `build()` 函数。
- **多线程**：批量处理通过 Comlink 在 Worker 池中并行运行，主线程保持流畅；右侧「实时预览」也走 Worker。
- **端侧 AI**：证件照模型按需动态加载（只在进入该页面时下载），GPU 委托失败自动降级 CPU，模型失败时降级为手动构图。
- **兼容性兜底**：Safari 不支持 `ctx.filter`，模糊与调色都有手写回退；画布尺寸限制在 iOS 安全范围内。

## 扩展方向

- 换用更高精度的抠图模型（如 RMBG / MODNet 的 ONNX 版本，通过 onnxruntime-web 推理），只需替换 `core/idphoto/analyze.ts` 中的 `buildMask`
- HEIC 解码（`heic2any` / libheif wasm）
- PWA 离线缓存（`vite-plugin-pwa`）
- 拼图单元格内拖拽取景、文字图层自由拖拽编辑
