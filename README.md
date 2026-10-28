# 图盒 Tubox

纯前端图片处理工具箱，所有处理都在浏览器内完成，图片不会上传。基于 [AGPL-3.0](#许可证) 开源。界面支持简体中文、繁體中文、English、日本語、한국어、Español、Français、Deutsch、Português、Русский。

| 模块               | 能力                                                                                                                                                                                                                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **批量处理**       | 统一尺寸（长边 / 适应 / 裁切填充 / 拉伸 / 固定宽高 / 百分比）、质量压缩、**按目标体积压缩**、文字 / Logo 水印（九宫格定位、斜向平铺防盗）、格式转换（JPG / PNG / WebP / AVIF）、文件名模板、ZIP 打包                                                                                                                   |
| **AI 抠图**        | 人物 / 商品 / 动物等主体一键去背景（ISNet，WebGPU 优先、WASM 回退，Worker 推理）、透明 / 纯色 / 原图虚化背景、边缘收缩扩展与羽化、裁剪到主体、按住对比原图、PNG / WebP / JPG 原分辨率导出                                                                                                                              |
| **AI 高清放大**    | Real-ESRGAN（realesr-general-x4v3）放大 2 倍 / 4 倍，重建细节、去噪去压缩块，分块推理无接缝，WebGPU 优先、WASM 回退（Worker 推理，可取消），支持透明 PNG，拖动分割线对比 + 滚轮缩放平移查看细节                                                                                                                        |
| **图片标注**       | 箭头 / 矩形 / 椭圆 / 直线 / 画笔 / 荧光笔 / 文字 / 序号 / 马赛克，选中后可移动、改色、改粗细，双击文字重新编辑，Shift 约束正方形 / 正圆 / 45°，撤销重做与快捷键，原分辨率导出                                                                                                                                          |
| **隐私查看与清除** | 读取 GPS 位置、拍摄设备、序列号、拍摄时间、编辑软件、作者、PNG 文本块等元数据；直接删除 EXIF / XMP / IPTC / 注释段（JPG / PNG / WebP / GIF 无损，不重新压缩），可保留方向与 ICC 色彩配置，批量 ZIP 下载                                                                                                                |
| **证件照**         | 30+ 规格（一寸二寸、3×4、身份证、护照，美 / 英 / 欧盟 / 加 / 澳 / 印 / 日 / 韩 / 俄护照，美 / 申根 / 日 / 韩 / 英 / 加 / 澳签证、国考 / 教资 / 四六级等；非中文界面默认当地护照规格）、AI 人像分割换底、人脸定位自动构图与歪头纠正、调色、规格合规检测、体积达标、冲印排版（6 寸 / 5 寸 / A4，带裁切线，写入 300 DPI） |
| **长图拼接**       | 竖向 / 横向、电影字幕拼接、间距 / 边距 / 圆角 / 背景，超出浏览器画布上限自动缩放                                                                                                                                                                                                                                       |
| **自由拼图**       | 18 种模板（2-9 张），7 种画布比例（含 Instagram 4:5），按图片数量自动推荐模板                                                                                                                                                                                                                                          |
| **九宫格切图**     | 九宫格 / 四宫格 / 六宫格 / 横竖三连，单张 1:1 / 4:5 / 3:4（Instagram 主页网格），拖拽取景，朋友圈间隙预览，一键打包                                                                                                                                                                                                    |
| **社交排版**       | 小红书 / 朋友圈 / 视频号 / 微博 / 公众号封面，Instagram 帖子与快拍 / YouTube 封面 / X / Facebook / Pinterest；6 种版式 × 6 套配色 × 2 种字体                                                                                                                                                                           |
| **GIF 制作**       | 最多 60 张图片合成 GIF，帧时长、淡入淡出、往返播放、循环，画面比例 / 裁切或完整显示 / 输出宽度 / 颜色数，实时预览，Worker 内编码（gifenc）                                                                                                                                                                             |
| **视频转 GIF**     | MP4 / WebM / MOV，时间轴拖动截取片段（最长 30 秒，带缩略图），帧率 5-25 fps、0.5-3 倍速、往返播放、循环，原比例或裁切为 1:1 / 4:5 / 3:4 / 16:9 / 9:16，输出宽度 / 颜色数，按帧率实时预览，导出可取消                                                                                                                   |
| **二维码生成**     | 网址 / 文本 / Wi-Fi / 电子名片（vCard），方块 / 圆润 / 圆点码点与方形 / 圆角 / 圆形定位点，四套本地生成式艺术背景、照片融图与强度调节，颜色渐变、定位点单独配色、透明背景，中间 Logo（自动挖空并切到 H 容错），低对比度与艺术码扫码提示，导出 PNG / JPG（最高 2048px）或矢量 SVG                                       |

## 快速开始

```bash
pnpm install
pnpm setup:models   # 可选：把 MediaPipe wasm / 模型、抠图模型与放大模型（约 122MB）下载到 public/，实现完全自托管
pnpm dev
```

不执行 `setup:models` 也能运行：证件照会回退到 jsDelivr / Google Storage，抠图回退到 staticimgly.com，高清放大回退到 Hugging Face 加载模型（国内网络可能较慢或无法访问）。
也可以设置 `VITE_MODEL_BASE=https://your-cdn/tubox`，从自己的 CDN 加载。

```bash
pnpm build      # 自动执行 setup:models + 类型检查 + 打包到 dist/（模型随站点自托管）
```

### 部署

使用 History 路由（`/batch`、`/collage/grid`），其它语言加前缀（`/en/batch`、`/zh-tw/collage/grid`，各语言首页为 `/en`、`/ja`…）。构建时会为每个语言的每个路由预渲染一份带独立标题 / 描述 / 结构化数据的 HTML（`dist/batch.html`、`dist/en/collage/grid.html`、`dist/en.html`…），静态托管需要：先按 `路径.html` 查找，找不到再回退到 `index.html`：

- **Nginx**：`location / { try_files $uri $uri.html /index.html; }`
- **Vercel**：`vercel.json` → `{ "cleanUrls": true, "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
- **Netlify / Cloudflare Pages**：自动按 `路径.html` 匹配；再在 `public/_redirects` 加 `/*  /index.html  200` 兜底
- **部署在子路径**：`pnpm build --base=/tubox/`，路由 basename 会自动跟随

### 多语言

- 文案在 `src/i18n/messages/`：`zh-CN.ts` 是源语言，其结构即 `Messages` 类型，其它语言文件缺键会类型报错；运行时按语言拆包按需加载。
- 语言由 URL 决定。访问不带前缀的地址时，按「用户上次的选择 → 浏览器语言」自动跳到对应语言（爬虫不跳转）；侧边栏 / 顶栏可切换语言并记住选择。
- 新增语言：在 `src/i18n/locales.ts` 登记，在 `messages/` 下添加同名文件，并加入 `src/i18n/catalog.ts`。

### SEO

各页面的标题、描述、关键词、功能要点在各语言文案的 `seo` 中（逻辑在 `src/seo.ts`），构建时由 `scripts/seo-plugin.ts` 写入每个语言 × 路由的 HTML（含给百度等不执行 JS 的爬虫看的静态正文、`<html lang>`），站内跳转时由 `useSeo` 同步更新。构建前设置站点地址，才会输出 canonical、`og:url`、hreflang 与 `sitemap.xml`：

```bash
VITE_SITE_URL=https://tubox.example.com pnpm build   # 或写进 .env.production
```

`pnpm dev` / `pnpm preview` 已内置回退，开发时无需配置。

社交分享图（`og:image` / `twitter:image`，1200×630）每种语言一张，放在 `public/og/<语言>.png` 并提交到仓库。改了首页标语、工具名或品牌样式后用 `pnpm og:images` 重新生成（需要本机 Chrome，可用 `CHROME_PATH` 指定）。

### 访问统计

使用 Cloudflare Web Analytics（无 Cookie、不采集个人信息），由 Cloudflare Pages 在边缘自动注入 beacon，代码中无需接入；改用其它托管时需在 `index.html` 手动加上统计脚本。

## 技术栈

Vite 6 · React 19 · TypeScript · Tailwind CSS 3 · Zustand · Framer Motion · Comlink（Web Worker）· gifenc · uqr · MediaPipe Tasks Vision · @imgly/background-removal（onnxruntime-web）· Real-ESRGAN · JSZip · Geist 字体

## 架构

```
src/
├── core/                  # 图像引擎：纯 TS，不依赖 React，主线程与 Worker 通用
│   ├── canvas.ts          #   OffscreenCanvas / <canvas> 抽象、解码、高质量逐级缩放、特性检测
│   ├── encode.ts          #   编码 + 目标体积（质量二分 → 逐步缩图）、JPEG DPI 写入
│   ├── batch/             #   批量管线：resize → watermark → encode → rename
│   ├── scene/             #   声明式场景图 + 渲染器（图片 / 矩形 / 文字图层，渐变、圆角、阴影、模糊、旋转、中英文换行）
│   ├── collage/           #   长图 / 拼图模板 / 九宫格 / 社交版式 —— 只负责「生成场景」
│   ├── cutout/            #   通用抠图：imgly 推理、蒙版收缩扩展 / 羽化、背景合成
│   ├── upscale/           #   AI 高清放大：onnxruntime 加载、分块推理、透明通道处理
│   ├── qrcode/            #   二维码：内容拼装（Wi-Fi / vCard）、码点样式排版、Canvas / SVG 绘制
│   ├── annotate/          #   标注图形（原图坐标）、渲染、命中测试
│   ├── exif/              #   按容器格式扫描元数据段、解析 EXIF（TIFF）、无损删除
│   ├── gif/               #   帧序列规划与绘制、gifenc 逐帧量化编码
│   └── idphoto/           #   规格库、MediaPipe 加载、人像分析、构图合成、冲印排版
├── workers/               # 批量处理 Worker 池、抠图 / 放大推理 Worker、GIF 编码 Worker（不支持 OffscreenCanvas 时回退主线程）
├── stores/                # Zustand：每个工具一个 store，切换页面状态不丢失
├── components/
│   ├── icons/             #   工具专属双色图标（墨色描边 + 品牌色强调）
│   ├── ui/                #   设计系统：Button / Segmented / Slider / Switch / Section / ColorSwatches…
│   ├── layout/            #   AppShell / Sidebar / ToolLayout（标题栏 + 素材栏 + 舞台 + 检查器）
│   └── common/            #   Dropzone / CompareSlider / ScenePreview / SceneThumb / ImageStrip
├── features/              # 页面：home / batch / cutout / upscale / annotate / exif / idphoto / collage / gif / qrcode
├── i18n/                  # 多语言：语言表与路由前缀、插值 / 复数、各语言文案（含 SEO）
├── hooks/  lib/           # 通用 hooks 与工具函数
└── config.ts              # 模型与 wasm 地址（自托管优先，CDN 回退）
```

### 关键设计

- **引擎与 UI 分离**：`core/` 全部是纯函数，可以单测，也可以直接搬到 Node（配合 `@napi-rs/canvas`）或 Worker。
- **场景图**：所有排版类工具输出同一种 `Scene`，同一个渲染器负责预览（按显示尺寸 × DPR 渲染）和导出（原始分辨率），新增模板只需写一个 `build()` 函数。
- **多线程**：批量处理通过 Comlink 在 Worker 池中并行运行，主线程保持流畅；右侧「实时预览」也走 Worker。
- **AI 模型**：按需动态加载（只在进入对应页面时下载）。证件照用 MediaPipe，GPU 委托失败自动降级 CPU，模型失败时降级为手动构图；抠图用 @imgly/background-removal，高清放大用 Real-ESRGAN（直接调用 onnxruntime-web，复用抠图的 wasm 资源），都在独立 Worker 中推理，WebGPU 失败回退 WASM。
- **兼容性兜底**：Safari 不支持 `ctx.filter`，模糊与调色都有手写回退；画布尺寸限制在 iOS 安全范围内。

## 扩展方向

- 换用更高精度的抠图模型（如 RMBG / MODNet 的 ONNX 版本，通过 onnxruntime-web 推理），只需替换 `core/idphoto/analyze.ts` 中的 `buildMask`
- HEIC 解码（`heic2any` / libheif wasm）
- PWA 离线缓存（`vite-plugin-pwa`）
- 拼图单元格内拖拽取景、文字图层自由拖拽编辑

## 许可证

Copyright (C) 2026 Tubox contributors

本项目以 [GNU Affero General Public License v3.0](LICENSE)（AGPL-3.0-only）发布。AI 抠图使用的 [@imgly/background-removal](https://github.com/imgly/background-removal-js) 以 AGPL-3.0 发布，因此本项目整体按 AGPL-3.0 开源。

本程序是自由软件，按「原样」提供，**不提供任何担保**，包括适销性或特定用途适用性的默示担保，详见 [LICENSE](LICENSE)。

### 部署修改版

AGPL-3.0 第 13 条要求：通过网络向用户提供修改后的版本时，必须向这些用户提供对应的完整源代码。

- 站点侧边栏与首页页脚都有「源代码」入口，默认指向本仓库。部署修改版时，请把它指向你公开的源码仓库（需包含你的全部修改）：

  ```bash
  VITE_SOURCE_URL=https://github.com/you/your-fork pnpm build   # 或写进 .env.production
  ```

- 保留页脚的许可声明，不要移除。
- 构建时会生成 `dist/third-party-licenses.txt`（`scripts/licenses-plugin.ts`），汇总打包进产物的全部第三方依赖及其许可证全文，页脚「第三方许可」链接到该文件。
