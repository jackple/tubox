# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

图盒 Tubox：纯前端图片处理工具箱（批量处理 / 证件照 / 长图 / 拼图 / 九宫格 / 社交排版）。**所有处理都在浏览器内完成，没有后端**，图片不上传。UI 文案、注释、toast 均为中文。

技术栈：Vite 6 · React 19 · TypeScript（strict）· Tailwind CSS 3 · Zustand · Framer Motion · Comlink · MediaPipe Tasks Vision · JSZip。包管理用 **pnpm**。

## 常用命令

```bash
pnpm install
pnpm dev             # 开发服务器（已内置 History 路由回退）
pnpm typecheck       # tsc --noEmit
pnpm build           # 类型检查 + vite build 到 dist/
pnpm preview         # 预览构建产物
pnpm format          # prettier 格式化 src/**/*.{ts,tsx,css}
pnpm setup:models    # 把 MediaPipe wasm 与 .tflite 模型下载到 public/（自托管，已 gitignore）
pnpm build --base=/tubox/   # 部署到子路径，路由 basename 自动跟随 BASE_URL
```

项目**没有测试框架和 lint 配置**，改动后用 `pnpm typecheck`（或 `pnpm build`）验证。tsconfig 开启了 `noUnusedLocals` / `noUnusedParameters`，未使用的变量会导致构建失败。

代码风格（`.prettierrc`）：无分号、单引号、`printWidth: 140`、尾逗号，使用 `prettier-plugin-tailwindcss` 自动排序 class。路径别名 `@/` → `src/`。

## 架构

### 分层：引擎与 UI 分离

- `src/core/` —— 图像引擎，**纯 TS，不依赖 React/DOM 专属 API**，同一份代码同时跑在主线程和 Web Worker。不要在 `core/` 中引入 React、store、toast 等。
- `src/stores/` —— Zustand，每个工具一个 store（模块级单例），切换页面状态不丢失。业务流程（加载、分析、导出）写在 store 的 action 里。
- `src/features/` —— 页面组件，按工具分目录；`features/tools.ts` 是工具注册表（标题、路径、图标、分组），被 Sidebar / 首页 / `ToolLayout` 共用。
- `src/components/layout/ToolLayout.tsx` —— 所有工具页的统一工作台布局：header + 左侧素材栏 + 中间舞台 + 右侧 inspector。
- 路由在 `src/App.tsx`，每个页面 `lazy()` 拆包（MediaPipe 只在进入证件照时加载）。使用 History 路由，部署时需要服务器回退到 `index.html`（见 README）。

**新增工具**需同时改：`features/tools.ts`（注册）、`App.tsx`（路由）、`src/seo.ts`（SEO 文案，构建时据此预渲染该路由的 HTML 与 sitemap）、`components/icons/ToolGlyphs.tsx`（图标）、对应 store 与 `core/` 实现。

### Canvas 抽象（`core/canvas.ts`）

所有画布操作都通过 `createCanvas` / `getCtx` / `canvasToBlob` / `decodeImage` / `resample`，它们在有 `OffscreenCanvas` 时用 Offscreen（Worker 里只有它），否则回退 `<canvas>`。类型用 `AnyCanvas` / `Ctx2D` / `Drawable`。不要直接 `document.createElement('canvas')`。画布尺寸受 `MAX_CANVAS_SIDE` / `MAX_CANVAS_AREA`（iOS Safari 安全上限）约束。

### 场景图（`core/scene/`）

长图、拼图、九宫格、社交排版都**只负责生成声明式 `Scene`**（`rect` / `image` / `text` 图层，支持渐变、圆角、阴影、模糊、旋转、中英文换行），由同一个渲染器处理：

- 预览：`components/common/ScenePreview.tsx` 按显示尺寸 × DPR 调用 `renderScene`，带像素预算防止长图爆内存。
- 导出：`exportScene(scene, type, quality, scale)` 按原始分辨率输出。

新增模板/版式只需在 `core/collage/` 写一个返回 `Scene` 的 build 函数（如 `buildGrid`、`buildLongImage`、`socialStyles` 中的条目）。拼图模板单元格是 0-1 归一化坐标，经 `layoutCells` 换算为像素。

### 批量处理与 Worker 池

管线 `core/batch/process.ts` 的 `processImage`：解码 → `planResize` → 水印 → `encodeCanvas` → 文件名模板。它是纯函数，通过 Comlink 暴露在 `workers/batch.worker.ts`。`workers/pool.ts` 的 `processInPool` 按 CPU 核数（最多 6）开 Worker 池；不支持 OffscreenCanvas 时直接在主线程调用。传给 Worker 的参数（`BatchOptions` 等）必须可结构化克隆（Blob 可以，`ImageBitmap`/函数不行）。

### 编码（`core/encode.ts`）

`encodeCanvas` 支持「目标体积」：有损格式先二分质量，不达标再按 0.85 逐步缩图。`withJpegDpi` 直接改写 JFIF 头写入 DPI（证件照冲印依赖它）。

### 证件照（`core/idphoto/` + `stores/idphoto.ts`）

- `vision.ts`：动态 import `@mediapipe/tasks-vision`，加载 `selfie_multiclass` 分割模型和 `blaze_face` 人脸检测；GPU 委托失败降级 CPU；Promise 缓存，失败时清空缓存以便重试。
- 资源地址在 `src/config.ts`，按顺序探测：`VITE_MODEL_BASE` → 本地 `public/`（`setup:models` 生成）→ CDN。探测时排除 `text/html` 响应，因为 Vite dev server 对不存在的文件会回退 index.html。CDN 版本号通过 vite `define` 注入的 `__MEDIAPIPE_VERSION__` 获得。
- `analyze.ts`：分割蒙版 + 人脸框 → 估算头顶/下巴/中心；任一模型失败都降级（无人脸则默认构图，无蒙版则保留原背景）。想换更高精度抠图模型，替换 `buildMask` 即可。
- `compose.ts`：`autoFrame` 根据规格的 `headRatio` / `topRatio` 自动构图，`composeIdPhoto` 合成成片；`printSheet.ts` 冲印排版；`specs.ts` 规格库与背景色。
- 工作分辨率固定为 `ID_PHOTO_WORKING_SIZE`（长边 1600）。
- `features/idphoto/useComposed.ts` 用 `useShallow` 订阅影响成片的字段再 `useMemo` 渲染。store 中的派生 getter（`spec()`、`render()` 等）每次返回新对象，**不要直接在 selector 里调用**，否则会导致无限重渲染；用 `resolveSpec` + `useMemo`。

### 资源生命周期

`lib/assets.ts` 的 `loadAsset` 解码为 `ImageBitmap`（超大图降采样到 4096）并创建 object URL；移除时必须 `disposeAsset`（`revokeObjectURL` + `bitmap.close()`）。`core/` 中临时解码的 bitmap 也在 `finally` 里 `close()`。拼图类 store 通过 `stores/collage.ts` 的 `assetList` 工厂共享增删排序逻辑。

### 兼容性

Safari 不支持 `ctx.filter`，模糊与调色都有手写回退，改动渲染/调色时保留这些回退分支。`decodeImage` 使用 `imageOrientation: 'from-image'` 自动应用 EXIF 方向；HEIC 目前不支持。

### 样式与主题

颜色全部是 CSS 变量 token（`src/styles/index.css` 中 `:root` / `.dark`），在 `tailwind.config.ts` 映射为 `bg` / `panel` / `subtle` / `line` / `fg` / `muted` / `brand` / `accent` 等。使用这些语义类名，不要硬编码颜色。暗色模式为 `class` 策略，由 `stores/theme.ts` 切换 `<html>` 上的 `dark` 类。设计语言：中性墨色 + 单一鸢尾紫（brand），颜色只用于选中/焦点/品牌细节。通用 UI 组件在 `components/ui/`，类名合并用 `lib/cn.ts`。
