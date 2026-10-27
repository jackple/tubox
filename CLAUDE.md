# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 沟通语言

- **回答一律使用中文**(包括代码注释、提交说明、需求沟通)

## 项目概述

图盒 Tubox：纯前端图片处理工具箱（批量处理 / 证件照 / 长图 / 拼图 / 九宫格 / 社交排版）。**所有处理都在浏览器内完成，没有后端**，图片不上传。界面支持 10 种语言（见下文「多语言」），代码注释为中文。

技术栈：Vite 6 · React 19 · TypeScript（strict）· Tailwind CSS 3 · Zustand · Framer Motion · Comlink · gifenc · MediaPipe Tasks Vision · @imgly/background-removal（onnxruntime-web）· JSZip。包管理用 **pnpm**。

## 常用命令

```bash
pnpm install
pnpm dev             # 开发服务器（已内置 History 路由回退）
pnpm typecheck       # tsc --noEmit
pnpm build           # setup:models + 类型检查 + vite build 到 dist/（模型随站点自托管）
pnpm preview         # 预览构建产物
pnpm format          # prettier 格式化 src/**/*.{ts,tsx,css}
pnpm setup:models    # 把 MediaPipe wasm / .tflite 模型与 imgly 抠图模型下载到 public/（自托管，已 gitignore）
pnpm og:images       # 用本机 Chrome 按各语言文案重新生成社交分享图 public/og/<语言>.png（提交到仓库）
pnpm build --base=/tubox/   # 部署到子路径，路由 basename 自动跟随 BASE_URL
```

项目**没有测试框架和 lint 配置**，改动后用 `pnpm typecheck`（或 `pnpm build`）验证。tsconfig 开启了 `noUnusedLocals` / `noUnusedParameters`，未使用的变量会导致构建失败。

代码风格（`.prettierrc`）：无分号、单引号、`printWidth: 140`、尾逗号，使用 `prettier-plugin-tailwindcss` 自动排序 class。路径别名 `@/` → `src/`。

## 架构

### 分层：引擎与 UI 分离

- `src/core/` —— 图像引擎，**纯 TS，不依赖 React/DOM 专属 API**，同一份代码同时跑在主线程和 Web Worker。不要在 `core/` 中引入 React、store、toast 等。
- `src/stores/` —— Zustand，每个工具一个 store（模块级单例），切换页面状态不丢失。业务流程（加载、分析、导出）写在 store 的 action 里。
- `src/features/` —— 页面组件，按工具分目录（图片标注、隐私清除、GIF 也复用 `features/collage/shared.tsx` 的 `EmptyStage` / `ExportFooter`）；`features/tools.ts` 是工具注册表（标题、路径、图标、分组），被 Sidebar / 首页 / `ToolLayout` 共用。
- `src/components/layout/ToolLayout.tsx` —— 所有工具页的统一工作台布局：header + 左侧素材栏 + 中间舞台 + 右侧 inspector。
- 路由在 `src/App.tsx`，每个页面 `lazy()` 拆包（MediaPipe / onnxruntime 只在进入证件照 / 抠图时加载）。使用 History 路由，部署时需要服务器回退到 `index.html`（见 README）。

**新增工具**需同时改：`features/tools.ts`（注册）、`App.tsx`（路由）、`src/seo.ts` 的 `pagePaths`（构建时据此预渲染各语言该路由的 HTML 与 sitemap，`page` 字段用于在 HTML 中预加载页面 chunk）、各语言文案的 `tools` 与 `seo`、`components/icons/ToolGlyphs.tsx`（图标）、对应 store 与 `core/` 实现。

### 多语言（`src/i18n/`）

- **不要在组件、store、core 中硬编码界面文案**。文案在 `i18n/messages/`：`zh-CN.ts` 为源语言，`Messages = typeof zhCN`，其余语言 `const messages: Messages`，缺键即类型错误——新增文案要同时补齐所有语言文件。
- 组件用 `useMessages()`，store / toast 等非组件代码用 `getMessages()`；插值 `fmt(s, vars)`（`{name}` 占位符）；数量相关文案在源语言中用 `p({ other })` 标记，调用 `plural(msg, count)`（按 `Intl.PluralRules`，俄语需 one/few/many）；需要把占位符渲染为元素用 `rich()` + `pluralTemplate()`。
- `core/` 保持无文案：数据只带 id（规格、模板、配色、相纸等），显示名在文案中按 id 查（`label(table, id)`）；错误抛 `coreError(code)`（`core/errors.ts`），UI 用 `errorMessage(e)` 翻译。
- 语言由 URL 决定：默认简体中文无前缀，其余为 `/en/...`、`/zh-tw/...`（`i18n/locales.ts` 的 `splitLocale` / `localizePath`）。站内链接一律用 `useLocalizedPath()` 包装路径。`stores/locale.ts` 按需加载语言包；`main.tsx` 在首屏前调用 `initLocale()`（可能按偏好 / 浏览器语言改写 URL），`AppShell` 随路由切换语言。
- `i18n/locales.ts`、`i18n/format.ts`、`i18n/messages/*`、`src/seo.ts` 会在构建时被 `scripts/seo-plugin.ts`（Node）导入，只能用相对路径导入，不能用 `@/`。`i18n/catalog.ts` 静态汇总全部语言，仅供构建时使用。

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

### AI 抠图（`core/cutout/` + `stores/cutout.ts` + `workers/cutout.ts`）

- 基于 `@imgly/background-removal`（ISNet，onnxruntime-web 推理，**AGPL-3.0**，本项目因此开源）。`matte.ts` 的 `segmentSubject` 调用 `segmentForeground`，输入输出都用库内置的 `image/x-rgba8` 原始像素格式；WebGPU 失败自动回退 WASM。imgly 按配置缓存初始化 Promise（含失败），重试时通过 `fetchArgs.attempt` 换缓存键。
- 推理在独立 Worker 中（`workers/cutout.worker.ts`，会话常驻），进度回调经 `Comlink.proxy` 作为**顶层参数**传入；不支持 OffscreenCanvas 时回退主线程。
- 推理只在长边 `MATTE_SIZE`（1024，等于模型输入）的工作图上进行；`buildMatte` 做收缩/扩展、羽化并给出主体外接框；`compose.ts` 的 `composeCutout` 按源图区域合成（透明 / 纯色 / 原图虚化），预览限制长边 1600，导出按原图（长边上限 4096）。
- 资源（`resources.json` + 4MB 分块的模型与 wasm）地址见 `config.ts` 的 `imglyAssets`：`VITE_MODEL_BASE/imgly/<版本>/` → 本地 `public/imgly/<版本>/`（`setup:models` 只下载 `IMGLY_MODEL` 与 onnxruntime，两处需保持一致）→ staticimgly.com CDN。
- `vite.config.ts` 把 `onnxruntime-web` 别名到非 bundle 版本：wasm 由 imgly 以 blob URL 传入，否则 Vite 会多打包一份 24MB 的 wasm。

### 图片标注（`core/annotate/` + `stores/annotate.ts`）

- 图形（`types.ts`）坐标均为原图像素；`size` 是 1-10 档位，由 `metrics(size, unitOf(w, h))` 按图片长边换算像素，预览与导出观感一致。`renderAnnotations` 同时用于预览（传显示缩放）与导出（`exportAnnotated`，scale 1）。
- `Shape` 联合中 `BoxShape` / `PathShape` 的 `kind` 是多值联合，`s.kind === 'pen'` 无法排除成员，用 `isBox` / `isPath` 类型守卫收窄；新建图形参数用 `NewShape`（按成员分别 Omit id）。
- store 的 `commit` 统一记入撤销历史；拖动中的图形是组件内的 draft，松手后才 `add` / `replace`。序号按出现顺序在渲染时编号。

### 隐私查看与清除（`core/exif/` + `stores/exif.ts`）

- `scan.ts` 只解析容器结构，找出元数据块（JPEG APPn/COM、PNG 辅助块、WebP RIFF 块、GIF 扩展块）；`read.ts` 从 EXIF（TIFF）/ XMP / PNG 文本中提取隐私字段；`strip.ts` 直接删除这些字节段，不重新编码。JPEG 的 APP0（JFIF）与 APP14（Adobe）、GIF 的循环扩展必须保留。
- 「保留方向」会写回只含 Orientation 的最小 EXIF（PNG 需重算 CRC，WebP 需同步 VP8X 标志位与 RIFF 长度）。不支持的格式（AVIF / HEIC / BMP）回退为解码后重新编码 PNG。
- 拍摄位置的具体地址由 `lib/geocode.ts` 调用 OpenStreetMap Nominatim 反查，这是全站唯一把照片相关数据发往第三方的地方：只能由用户点击触发，不要改成自动查询；展示结果需注明 © OpenStreetMap 贡献者，请求间隔 ≥1 秒。

### GIF 制作（`core/gif/` + `stores/gif.ts` + `workers/gif.ts`）

- `planFrames` 把图片数量与选项展开为帧序列（往返、淡入淡出插值帧），`drawFrame` 绘制单帧，预览与导出共用。
- 编码用 gifenc（无类型声明，见 `src/types/gifenc.d.ts`），每帧单独量化调色板；导出时主线程逐帧绘制、像素 transfer 给一次性 Worker 编码，主线程画下一帧与 Worker 编码上一帧并行。

### 开源许可（AGPL-3.0）

- 因依赖 `@imgly/background-removal`，项目以 AGPL-3.0-only 发布（根目录 `LICENSE`）。界面必须保留许可声明与源代码入口：侧边栏底部与首页页脚（文案在 `legal`，地址为 `config.ts` 的 `SOURCE_URL`，可用 `VITE_SOURCE_URL` 覆盖）。
- `scripts/licenses-plugin.ts` 在构建时汇总主包与 Worker 包中所有 npm 依赖的许可证，生成 `dist/third-party-licenses.txt`；新增运行时下载的模型时，在其中的 `MODELS` 登记。

### 资源生命周期

`lib/assets.ts` 的 `loadAsset` 解码为 `ImageBitmap`（超大图降采样到 4096）并创建 object URL；移除时必须 `disposeAsset`（`revokeObjectURL` + `bitmap.close()`）。`core/` 中临时解码的 bitmap 也在 `finally` 里 `close()`。拼图类 store 通过 `stores/collage.ts` 的 `assetList` 工厂共享增删排序逻辑。

### 兼容性

Safari 不支持 `ctx.filter`，模糊与调色都有手写回退，改动渲染/调色时保留这些回退分支。`decodeImage` 使用 `imageOrientation: 'from-image'` 自动应用 EXIF 方向；HEIC 目前不支持。

### 样式与主题

颜色全部是 CSS 变量 token（`src/styles/index.css` 中 `:root` / `.dark`），在 `tailwind.config.ts` 映射为 `bg` / `panel` / `subtle` / `line` / `fg` / `muted` / `brand` / `accent` 等。使用这些语义类名，不要硬编码颜色。暗色模式为 `class` 策略，由 `stores/theme.ts` 切换 `<html>` 上的 `dark` 类。设计语言：中性墨色 + 单一鸢尾紫（brand），颜色只用于选中/焦点/品牌细节。通用 UI 组件在 `components/ui/`，类名合并用 `lib/cn.ts`。界面字体 `font-sans` 指向 CSS 变量 `--font-sans`，按 `<html lang>` 切换简繁中日韩的 CJK 字体栈。
