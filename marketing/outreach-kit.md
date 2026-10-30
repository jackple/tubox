# 外联与投稿执行包

## 投稿优先级

### 中文产品与软件媒体

| 渠道 | 适合的内容 | 提交方式 |
|---|---|---|
| 小众软件 | 面向普通用户的实用教程和真实截图 | 通过官网投稿/联系入口提交，先说明可原创首发 |
| 少数派 Matrix | 场景化教程、隐私工作流、开源复盘 | 注册后投稿到 Matrix，遵守编辑规范和原创要求 |
| 知乎 | 工程实现、隐私取舍、具体问题解决 | 已有账号继续发布不同角度文章 |
| 掘金 | 技术拆解、WebGPU/WASM 实践 | 技术文章不与知乎逐字重复 |

不建议把同一篇通稿群发给所有媒体，也不购买“全网发布”套餐。编辑更容易采用有真实截图、有失败限制、有可验证结果的稿件。

### 英文开发者与目录

| 渠道 | 适合的内容 | 注意事项 |
|---|---|---|
| Show HN | 纯前端本地处理的技术实现 | 提交链接，正文简洁；不在当天重复提交 |
| DEV Community | Worker 池、模型加载、EXIF 容器裁剪教程 | 可注明原文来源，不机械复制 |
| Indie Hackers | 30 天推广实验和产品取舍 | 分享真实数据，不只发广告 |
| SaaSHub | 产品实体和替代品信息 | 保持官网与 GitHub 描述一致 |
| AlternativeTo | 与 Canva、TinyPNG、remove.bg 等替代关系 | 审核期间不要重复改提交 |
| GitHub Awesome | 自托管、隐私、浏览器 AI、图像工具列表 | 先读贡献规范，只投匹配项 |

## 中文编辑投稿邮件

主题：

```text
投稿：一个把图片处理留在浏览器里的开源工具
```

正文：

```text
编辑你好：

我想投稿介绍「图盒 Tubox」，一个免登录、图片不上传的浏览器图片工具箱：
https://tubox.top

它把批量压缩、AI 抠图、2×/4× 放大、证件照、九宫格、长图、GIF、EXIF 清理和二维码做成纯前端能力。用户选择的图片直接进入 Canvas、Worker 和浏览器内推理，没有图片上传接口。

我建议不要写成产品发布稿，而是做一篇可操作的教程，例如：

- 发朋友圈前，如何检查并无损删除手机照片的位置信息；
- 用一张手机自拍完成指定规格证件照并排版；
- 批量处理商品图时，如何同时控制尺寸和 200KB 文件上限。

我可以提供真实前后对比、操作截图，以及首次加载模型、低配手机性能等限制说明。项目以 AGPL-3.0 开源：
https://github.com/jackple/tubox

如果适合贵站，我可以按你们的角度和格式重写，不要求原文转载。

谢谢！
```

## 英文编辑投稿邮件

Subject:

```text
Pitch: a privacy-first image toolbox that runs entirely in the browser
```

Body:

```text
Hi [name],

I’m building Tubox, a browser-based image toolbox where the selected image is processed locally rather than uploaded to a server:
https://tubox.top/en

It covers batch compression, on-device AI background removal and upscaling, ID photos, collages, GIF conversion, EXIF cleanup and QR codes. The page and model files still load over the network, but there is no image-upload endpoint or account system.

For a tutorial, I could focus on one useful workflow instead of a launch announcement — for example:

• Remove GPS metadata without recompressing the photo
• Turn a phone photo into a print-ready passport photo
• Batch compress product images to a target file size

I can provide real before/after examples, limitations, and an honest note about first-load model performance. The source is AGPL-3.0:
https://github.com/jackple/tubox

Would any of those angles fit your audience?

Thanks,
[name]
```

## Awesome 列表 PR 模板

先确认列表确实接受“Web app / self-hostable tool”，并遵守字母排序、描述长度和链接要求。不要把同一个 PR 提交给十几个仓库。

```markdown
## What is added?

Tubox — A privacy-first collection of 13 browser-based image tools for batch processing, background removal, AI upscaling, ID photos, collages, GIF conversion, EXIF cleanup and QR codes. Images are processed locally; the project is AGPL-3.0 and can be self-hosted as a static site.

- Website: https://tubox.top
- Source: https://github.com/jackple/tubox
```

## 创作者协作边界

可以邀请真正使用图片工具的摄影、电商、设计或效率博主试用，并明确没有付费关系。不要要求：

- 只说好话；
- 删除兼容性或隐私限制；
- 隐藏赞助/合作；
- 在未体验产品前发统一通稿。

合作模板：

```text
你好，我是图盒 Tubox 的开发者。我们在浏览器里实现了批量压缩、AI 抠图、证件照和九宫格等图片工具，图片不上传服务器，项目开源。

看到你经常分享 [具体主题]，想邀请你免费试用并提出真实反馈。没有付费，也不要求你发布内容；如果你觉得某个流程确实有用，可以自行决定是否分享。首次进入 AI 工具需要下载模型，Safari 和低配手机上的表现尤其希望得到测试。

体验地址：[带对应 UTM 的链接]
```

## 每周外联节奏

- 周一：确认一个最佳场景，准备真实截图。
- 周二：给一个最匹配的中文编辑投稿。
- 周三：更新一个目录或提交一个 Awesome PR。
- 周四：发布一个英文技术内容，处理评论。
- 周五：根据当周导出成功率，停掉一个无效渠道或修复一个首次使用问题。

外联的目标是获得真实试用和可回复的反馈。若一个渠道只带来短时访问，没有进入工具或导出结果，不进入下周复投。
