# 图盒 Tubox 推广包

## 核心定位

**一句话：** 免登录、图片不上传，13 个图片工具直接在浏览器里运行。

优先传递的三个信息，按顺序：

1. **隐私可见：** 解码、压缩、AI 抠图和超分都在本机完成，站点不接收原图。
2. **打开即用：** 无需安装或注册，覆盖批量处理、证件照、拼图、动图和二维码。
3. **持续可验证：** 工具支持十种界面语言，不设付费墙，并公开源码。

避免使用“全球最强”“完全免费永久”等无法长期保证的绝对表述。站点使用 Cloudflare 匿名访问统计，这与“不上传图片”不冲突，但对外说明时不要写成“完全没有网络请求”。

## 当前基线（2026-10-28）

- Google 已收录首页、英文和各工具页；首页摘要仍显示旧版的“六个工具”。
- Bing 已发现 `https://tubox.top/sitemap.xml` 中的 70 个 URL，但 `site:tubox.top` 暂未返回结果。
- Cloudflare Web Analytics 过去 24 小时为 21 次访问、22 次页面浏览。
- Google 中暂未发现 `tubox.top` 的站外自然提及。

## 最新流量基线（2026-10-30）

- Cloudflare Web Analytics 过去 24 小时为 408 次访问、927 次页面浏览。
- 当前主要工具页已有稳定访问，可以开始观察各渠道的进入工具率和导出完成率。
- 阶段目标从“获得首批访问”转为“确认哪些站外渠道带来真实工具使用”。
- 百度搜索 `site:tubox.top` 无结果。
- 百度搜索资源平台索引量在 2026-10-23 至 2026-10-29 均为 0。
- 百度“普通收录 → 数据反馈”中，2026-09-30 至 2026-10-28 的手动提交趋势为 0。当前没有证据表明过去的手动提交成功，更不能据此判断已经收录。
- Bing `site:tubox.top` 当前返回约 7 个结果，已覆盖首页及抠图、长图、拼图、放大、视频转 GIF、九宫格等工具页。
- Google `site:tubox.top` 已有多页结果，首批包含首页、批量处理、英文首页、标注、EXIF、GIF 及多种语言首页。

## 首轮发布记录（2026-10-28）

- 已向 Bing Webmaster Tools 提交 98 个中文、繁体中文、英文、日文、韩文、西班牙文和法文页面 URL。
- 已在 V2EX「分享创造」发布首帖：https://www.v2ex.com/t/1252552
- 已保存 GitHub 仓库简介、正式站点主页和 18 个搜索标签。
- 已在知乎发布技术文章：https://zhuanlan.zhihu.com/p/2098793918645145667
- 已在掘金发布技术文章：https://juejin.cn/spost/7701525643872026659
- 已向 HelloGitHub 提交开源项目推荐：https://github.com/521xueweihan/HelloGitHub/issues/4143
- 已发布 GitHub `v0.1.0` Release。
- 已向 AlternativeTo 提交产品收录，正在等待审核。
- 已排期 Product Hunt，时间为 2026-11-03 12:01 AM PT。

## V2EX：分享创造

标题：

```text
做了个免登录、图片不上传的在线图片工具箱，已开源，想听听 V 友的反馈
```

正文：

```markdown
最近把平时散落在各种在线工具里的图片处理需求，收进了一个纯前端工具箱：

https://tubox.top/?utm_source=v2ex&utm_medium=community&utm_campaign=tubox_launch

它最想解决的是“处理方便”和“隐私放心”之间的冲突。图片解码、压缩、AI 抠图、AI 放大都在浏览器内完成，没有图片上传接口，也不需要注册账号。

目前有 13 个工具，比较常用的几个是：

- 批量压缩、改尺寸、格式转换、水印和 ZIP 下载
- AI 抠图与 2x / 4x 高清放大
- 30+ 规格的证件照，支持 AI 换底和冲印排版
- 拼图、长图、九宫格和社交媒体版式
- GIF / 视频转 GIF
- EXIF 隐私查看与无损清除
- 图片标注与二维码生成

技术上主要有两个取舍：

1. 批量任务放在 Web Worker 池里，界面不容易卡死；AI 推理优先用 WebGPU，失败时回退 WASM。
2. 模型按需加载并自托管在站点上，第一次进入相关工具会需要下载模型，之后会快一些。

项目以 AGPL-3.0 开源：
https://github.com/jackple/tubox

目前最想收集三类反馈：

- 你实际最常用的是哪个图片功能？
- Safari / iOS 或低配置设备上有没有明显卡顿、失败？
- 还有哪个高频场景值得优先补？

如果某个流程不好用，欢迎直接回帖，我会按反馈继续改。
```

建议附图：`public/og/zh-CN.png`。它能在一张图里同时表达品牌、核心承诺和工具范围。

## 即刻 / 朋友圈：短版

```text
做了个叫「图盒 Tubox」的图片工具箱：
不用登录，图片也不上传；批量压缩、AI 抠图、高清放大、证件照、九宫格、视频转 GIF 都在浏览器里完成。

不用安装，打开就能用：https://tubox.top

十三种工具，十种语言，代码也开源。第一次用 AI 功能会加载模型，欢迎帮我测测 Safari 和低配手机。
```

## 英文社区：短版

```text
I built Tubox, a privacy-first image toolbox that runs entirely in the browser:
https://tubox.top/en

It handles batch compression and resizing, background removal, 2x/4x upscaling, passport and ID photos, collages, GIF conversion, EXIF removal, annotations and QR codes.

No account and no image uploads. AI inference runs on-device with WebGPU and falls back to WASM. The source is AGPL-3.0.

Feedback I am looking for: Safari/iOS compatibility, first-load friction, and the one image task you would use most.
```

英文社区首轮只发一个与技术实现和本地隐私相关、允许展示项目的社区，避免多站同时复制粘贴。Reddit、Hacker News 和 Product Hunt 对自我推广的规则不同，发布前分别复核规则和账号资格。

## 发布顺序

1. **Bing URL 提交：** 优先提交中文、英文、日文、韩文、繁体中文及常用工具页，观察 48 小时。
2. **V2EX / 分享创造：** 用开发者视角发布，强调技术取舍、开源和求反馈。
3. **朋友圈 / 即刻：** 用短文案做熟人扩散，验证真实使用场景。
4. **英文社区：** 根据前两轮反馈修掉最明显的兼容性问题后发布。

同一天不要在所有渠道发完全相同的内容。每次首发到一个渠道后，至少留出半天回复评论，并把真实问题带进下一版改动。

## 监测

所有公开链接使用独立 UTM：

- V2EX：`utm_source=v2ex&utm_medium=community&utm_campaign=tubox_launch`
- 即刻：`utm_source=jike&utm_medium=social&utm_campaign=tubox_launch`
- 朋友圈：`utm_source=wechat&utm_medium=social&utm_campaign=tubox_launch`

每周记录：

- 各来源访问量、页面浏览量和热门工具页
- 搜索词带来的自然访问
- 百度提交成功数、索引量和 `site:tubox.top` 结果数
- 评论中的功能请求、兼容性问题和完成率阻碍
- GitHub Star、Issue 与外部自然提及

首轮不以单日访问峰值为目标。更有价值的信号是：用户进入工具页后是否真实完成一次导出，以及外部平台是否产生了可回复的具体反馈。

## 下一轮渠道优先级（2026-10-30）

1. **Product Hunt：** 发布前补齐英文画廊和首评，发布后专注回复评论与修复首次使用问题。
2. **Google 长尾搜索：** 优先优化已经获得曝光但点击低的中文工具页，不等待百度收录。
3. **Bing / IndexNow：** 保持页面更新后的主动通知，当前已有可见收录基础。
4. **Show HN / DEV：** 选择 Worker、WebGPU/WASM 和 EXIF 无损处理中的一个技术切口，不在同一天跨社区重复发布。
5. **B站 / 视频号 / 抖音：** 用证件照、EXIF 隐私、九宫格和批量压缩做真实前后对比。
6. **小众软件 / 少数派 Matrix：** 采用实操教程，不投产品发布通稿。
7. **AlternativeTo / SaaSHub / 匹配的 Awesome 列表：** 保持产品描述一致，只提交符合收录规则的目录。

百度先继续观察索引量和 `site:tubox.top`，不要在索引量为 0 时反复提交同一批 URL。部署 IndexNow 文件后再执行一次主动提交并记录返回状态。
