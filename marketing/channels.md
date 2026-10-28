# 图盒 Tubox 全渠道发布素材

公开链接统一使用 `utm_campaign=tubox_launch`，渠道名写入 `utm_source`。

## 技术长文：知乎

### 标题

```text
为什么我把图片工具箱做成了纯前端：一次本地 AI 图像处理的工程实践
```

### 正文

很多在线图片工具都很方便，但有一个共同问题：图片必须先上传到陌生服务器。对于证件照、身份证照片、私人相册和未公开的商品图，这个动作本身就会阻止一部分用户继续使用。

我最近做了一个名为「图盒 Tubox」的浏览器图片工具箱，尝试把通常需要服务端完成的处理搬回本地。项目覆盖批量压缩、改尺寸、格式转换、水印、AI 抠图、AI 高清放大、证件照、拼图、GIF、EXIF 清理和二维码，目前以 AGPL-3.0 开源。

在线使用：https://tubox.top/?utm_source=zhihu&utm_medium=article&utm_campaign=tubox_launch

源码：https://github.com/jackple/tubox

## 为什么是纯前端

纯前端并不等于“没有网络请求”。页面和静态资源仍然需要从 CDN 加载，我只使用不带 Cookie 的匿名访问统计。这里真正改变的是数据流：用户选择的图片直接交给浏览器里的 Canvas、Worker 和推理引擎，没有图片上传接口。

这带来三个直接收益：

1. 私密图片不需要经过第三方服务器。
2. 不需要账号、上传队列或云端存储。
3. 静态站点可以部署在 Cloudflare Pages 上，服务端成本接近零。

代价也很明确：计算发生在用户设备上，所以首次加载模型、内存占用、移动端兼容性和推理速度都会影响体验。

## 架构：计算在内核，交互在 React

项目把图像引擎和界面分开了。`src/core/` 不依赖 React，负责 Canvas、编码、场景渲染、EXIF 解析、GIF 编码和推理适配；React 页面只负责状态和交互。这样的边界让同一套能力可以在主线程、Worker 和测试环境中复用。

批量处理使用一个小型 Worker 池。池大小取 `navigator.hardwareConcurrency - 1`，最高 6 个，避免占满 CPU；任务领取空闲 Worker，不支持的浏览器回退主线程。

AI 部分采用按需加载。进入抠图或超分页面时才下载模型，模型会话在 Worker 内常驻，第二张图片不必重复加载。推理优先尝试 WebGPU，失败时回退 WASM；抠图和放大任务都放在独立 Worker 里，避免长时间计算卡住界面。

证件照是另一个典型例子：MediaPipe 负责人像分割和人脸检测，项目根据蒙版、面部框和眼睛关键点计算头顶与中心线，再进行构图。模型加载失败时仍允许手动调整，而不是让页面直接不可用。

## 如何处理图片元数据

普通的“去除 EXIF”经常重新编码整张图片，导致画质损失。Tubox 对 JPG、PNG、WebP 和 GIF 采用按容器结构裁剪元数据段的方式：找到 APP1、eXIf、XMP 等块后直接重建文件，不重新编码像素。

它还可以选择保留 Orientation 和 ICC。前者避免手机竖拍照片被转倒，后者避免广色域照片在不同设备上偏色。这是一个很小的功能，但对“处理完图片还能不能照常发”非常重要。

## 现在的限制

纯前端不是万能方案。大图、批量 AI 推理和低端手机仍然是挑战；不同浏览器的 Canvas、WebGPU 和内存能力也会造成体验差异。站点第一次加载 AI 模型时也无法和长期驻留云端的服务比较首屏速度。

所以当前的目标不是证明“所有图像处理都应该搬到浏览器”，而是在隐私敏感、即时使用、无需账户这组需求下，提供一个不牺牲实用性的选择。

## 最后的工程取舍

这个项目让我更确定一件事：隐私不应该只是一个宣传词，而应该体现在架构里。只要图片不进入上传接口，用户就不需要先判断服务商是否可信，再决定是否使用工具。

如果你也在做浏览器端图像或 AI 应用，欢迎交流 Worker 调度、WebGPU 回退、移动端内存和模型加载策略。工具本身也欢迎试用和反馈：

https://tubox.top/?utm_source=zhihu&utm_medium=article&utm_campaign=tubox_launch

## 技术文章：掘金

### 标题

```text
纯前端图片工具箱工程实践：Worker 池、WebGPU 回退与无损 EXIF 清理
```

### 正文

浏览器已经不再只能展示图片。借助 Canvas、Web Worker、WebAssembly 和 WebGPU，压缩、拼接、GIF 编码甚至 AI 推理都可以在用户设备上完成。

「图盒 Tubox」是一个以此为前提构建的开源项目，在线地址是 https://tubox.top/?utm_source=juejin&utm_medium=article&utm_campaign=tubox_launch ，源码在 https://github.com/jackple/tubox 。

## 1. 让图像引擎不依赖 React

项目把 `core/` 定义为纯 TypeScript 图像层。它只处理 Canvas、编码、场景图、EXIF、GIF 和模型适配。React 组件不直接操作像素，这样同一套引擎可以被 UI、Worker 和测试代码复用。

排版类工具最终都会生成一个声明式的 `Scene`。预览按显示尺寸和 DPR 渲染，导出时再按目标分辨率渲染。这样九宫格、社交封面、长图和自由拼图可以共享渲染器，而不是每个页面维护一套绘制逻辑。

## 2. 用 Worker 池限制并发

批量任务最怕两件事：主线程卡顿，以及一次拖入几十张图片造成内存峰值。

项目实现的 Worker 池先按空闲 Worker 排队，池大小控制在 `hardwareConcurrency - 1`，最高 6 个。批量处理、缩略图探测共用这个池，相当于同时限制解码和编码并发。

```ts
readonly size = Math.max(
  1,
  Math.min(6, (navigator.hardwareConcurrency || 4) - 1),
)
```

任务结束后无论成功失败都会释放 Worker。不支持 `OffscreenCanvas` 的环境则调用主线程版本，保持功能可用。

## 3. AI 推理的三级降级

AI 功能采用按需加载，避免首页下载不必要的模型。

- 首选 WebGPU 推理。
- GPU 委托失败时回退 WASM。
- 浏览器或模型加载失败时，证件照仍允许手动构图，不会直接阻断业务。

抠图和超分各自使用独立 Worker，模型会话常驻，第二张图开始可以复用。RGBA 缓冲区通过 `Comlink.transfer` 转移所有权，减少大对象在线程之间复制。

## 4. 不重编码像素的 EXIF 清理

许多工具通过重新导出图片来删除元数据，这会损失画质。项目根据文件容器结构定位 APP1、eXIf 和 XMP 等元数据块，直接重建文件。

同时保留两个可选配置：

- 保留 EXIF Orientation，防止手机竖拍照片方向错误。
- 保留 ICC Profile，防止广色域照片偏色。

## 5. 为什么选择静态部署

图盒的业务不需要后端 API，适合直接部署到 Cloudflare Pages。构建时会为十种语言、十四个页面预渲染静态 HTML，并生成 canonical、hreflang、结构化数据和 sitemap。

这类架构的边界也很清楚：优点是没有图片传输、无需账号、边际服务成本低；缺点是模型下载、设备性能、浏览器差异和内存限制都由客户端承担。

项目仍在持续迭代，欢迎从源码、Worker 池、模型降级或移动端兼容性方面提建议。

## 小红书与朋友圈短版

```text
做图经常遇到一个尴尬：功能分散在七八个网站，证件照、身份证照片又不太敢随手传。

于是做了「图盒 Tubox」：不用下载，不用注册，打开网页就能处理图片。AI 抠图、高清放大、证件照、九宫格、批量压缩、视频转 GIF 都在浏览器里完成。

我常用的是：批量压图 → 抠图换底 → 切九宫格 → 发图前清 EXIF。

https://tubox.top/?utm_source=xiaohongshu&utm_medium=social&utm_campaign=tubox_launch
```

小红书标签：

`#图片工具 #图片压缩 #证件照 #AI抠图 #九宫格 #效率工具 #隐私保护 #免费工具`

## 即刻

```text
做了个叫「图盒 Tubox」的纯前端图片工具箱。

13 个工具，十种语言；批量压缩、抠图、超分、证件照、拼图、GIF、EXIF 清理都在浏览器本地完成。不上传原图，不需要账号，源码 AGPL-3.0。

https://tubox.top/?utm_source=jike&utm_medium=social&utm_campaign=tubox_launch

欢迎帮我测 Safari 和低配手机。
```

## 朋友圈

```text
这段时间把一个图片工具箱彻底搬进了浏览器：批量压缩、AI 抠图、证件照、九宫格、GIF 和 EXIF 清理都能直接用，图片不需要上传。

打开即用：https://tubox.top/?utm_source=wechat&utm_medium=social&utm_campaign=tubox_launch
```

## 短视频脚本

### 15 秒：批量压缩

- 0–3 秒：桌面散落二十张产品图，字幕“发图又嫌太大？”
- 3–9 秒：打开 Tubox 批量处理，拖入图片，设置目标体积。
- 9–13 秒：展示体积下降和 ZIP 下载。
- 13–15 秒：字幕“图片不上传，tubox.top”。

### 20 秒：证件照

- 0–3 秒：手机自拍或普通生活照。
- 3–8 秒：进入证件照工具，选择“一寸 295×413”。
- 8–14 秒：AI 换底、自动构图、检查像素和文件体积。
- 14–20 秒：展示冲印排版与下载，CTA“tubox.top”。

### 20 秒：EXIF 隐私

- 0–4 秒：字幕“这张照片可能带着你拍它时的位置。”
- 4–10 秒：拖进 EXIF 工具，展示 GPS、设备和时间字段。
- 10–16 秒：一键无损清除，保留方向和 ICC。
- 16–20 秒：CTA“在浏览器里处理，不上传”。

## 开源与目录站投稿

### HelloGitHub / Awesome 系列推荐

```text
项目名：图盒 Tubox
一句话：免登录、图片不上传的浏览器图片工具箱
在线体验：https://tubox.top
源码：https://github.com/jackple/tubox
许可证：AGPL-3.0-only

亮点：13 个图片工具；批量任务使用 Web Worker 池；AI 抠图和超分在浏览器内执行，优先 WebGPU 并回退 WASM；JPG/PNG/WebP/GIF 元数据可无损清理；十种界面语言；Cloudflare Pages 静态部署。
```

### AlternativeTo

- Name: Tubox
- URL: https://tubox.top
- Category: Photo Editing, Image Converter, Privacy
- Tagline: Privacy-first image toolbox that runs in your browser
- Alternatives: Canva, remove.bg, TinyPNG, Adobe Express
- Description: Batch image processing, AI background removal and upscaling, ID photos, collages, GIF tools, EXIF cleanup and QR codes, all processed locally in supported browsers.

### Product Hunt

Tagline:

```text
13 image tools that run privately in your browser
```

Short description:

```text
Tubox combines batch compression, on-device AI background removal and upscaling, ID photos, collages, GIF tools, EXIF cleanup and QR codes in one no-signup web app.
```

### Show HN

Title:

```text
Show HN: Tubox – Privacy-first image toolbox that runs in your browser
```

Body:

```text
I built a browser-based image toolbox that avoids server-side uploads. Batch processing uses a Worker pool, AI background removal and upscaling use on-device inference with WebGPU and a WASM fallback, and metadata is removed at the container level without re-encoding pixels.

The app supports 13 tools, ten UI languages and has no account system. It is AGPL-3.0 and deployed as a static site. I would appreciate feedback on Safari/iOS compatibility and first-load model performance.

https://tubox.top/en
https://github.com/jackple/tubox
```

### GitHub Release

Tag:

```text
v0.1.0
```

Title:

```text
Tubox v0.1.0: 13 个在浏览器本地运行的图片工具
```

Description:

```markdown
首个公开版本。

- 批量压缩、统一尺寸、目标体积压缩、水印、格式转换、ZIP 导出
- AI 抠图与 2x / 4x 高清放大，WebGPU 优先、WASM 回退
- 30+ 证件照规格、AI 换底、自动构图与冲印排版
- 长图、自由拼图、九宫格和社交版式
- GIF 制作、视频转 GIF
- EXIF / XMP / IPTC 查看与容器级无损清理
- 图片标注和二维码生成
- 十种界面语言、独立 SEO 页面和自托管模型

在线体验：https://tubox.top

许可证：AGPL-3.0-only
```

### 少数派 / 小众软件投稿说明

```text
编辑你好，我想投稿介绍「图盒 Tubox」：一个免登录、图片不上传的浏览器图片工具箱。

它不是单纯聚合，而是把批量压缩、AI 抠图、超分、证件照、拼图、GIF 和 EXIF 清理做成纯前端能力。技术上使用 Worker 池、WebGPU/WASM 回退和按容器删除元数据，源码以 AGPL-3.0 开源。

可以按“隐私敏感图片如何不进云端也能处理”的角度写一篇实用教程，并提供真实操作截图。

在线体验：https://tubox.top
源码：https://github.com/jackple/tubox
```

## 发布纪律

- 知乎与掘金发布不同角度的原创内容，不复制完全相同的正文。
- 小红书必须用真实截图和真实操作结果。
- Product Hunt、Show HN 和英文社区发布前先检查账号年龄、发帖频率和版面规则。
- 目录站统一填写正式主页、GitHub 地址和简短英文描述。
- 不购买 Star、点赞、评论或低质量反向链接。

## 平台状态

- V2EX：已发布，https://www.v2ex.com/t/1252552
- GitHub：仓库简介与 Topics 已公开；README 推广版已推送；v0.1.0 Release 已发布。
- Bing：已成功提交 98 个核心页面 URL。
- 百度：站点已验证；当前账户的 sitemap 今日可用配额为 0。
- 知乎：技术文章已发布，https://zhuanlan.zhihu.com/p/2098793918645145667
- HelloGitHub：项目推荐已提交，https://github.com/521xueweihan/HelloGitHub/issues/4143
- 小红书：四张图片和正文已发布，账号为「小犬吠吠」，平台状态为审核中。
- 掘金：技术文章已发布，https://juejin.cn/spost/7701525643872026659
- 即刻：网页版要求 App 扫码登录。
- B 站：当前账号已登录，但等级不足，无法发布动态；视频投稿需另行制作成片。
- 微信：桌面客户端可用，朋友圈与群发涉及对外发布，等待明确受众与发布确认。
- Product Hunt：已完成产品页和首评，并排期到 2026-11-03 12:01 AM PT。
- AlternativeTo：产品已提交，等待平台审核。
- SaaSHub：未登录；提交前需要注册或登录并验证产品。
