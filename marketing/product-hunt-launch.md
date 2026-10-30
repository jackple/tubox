# Product Hunt 发布执行包

发布页已排期到 **2026-11-03 00:01 PT**，即北京时间 **2026-11-03 16:01**。以下材料用于发布前检查、当天转化和发布后跟进。

> 只邀请真实感兴趣的人体验并留下反馈，不换票、不群发索要 upvote，也不购买投票或评论。

## 发布前的硬性检查

Product Hunt 的首图决定点击，产品页本身决定停留。发布前完成以下检查：

1. 用游客身份从 Product Hunt 链接打开落地页，确认语言自动选择、主 CTA 和首屏加载正常。
2. 在 Chrome、Safari 和手机宽度各走一遍“选择图片 → 处理 → 下载”。
3. AI 页面补一张模型首次下载时的明确等待提示；避免用户误以为页面卡死。
4. Product Hunt 画廊使用 `marketing/assets/producthunt/` 下的四张 1270×760 图片；有条件时把第二张替换成真实界面截图。
5. 产品简介只承诺可验证的事实：13 个工具、十种界面语言、浏览器本地处理、无需账号、AGPL-3.0。
6. 不在宣传中写“完全不联网”。应写“图片不离开设备；仍需下载页面和模型文件”。
7. 统一使用下面带 UTM 的入口，便于区分 Product Hunt 带来的访问。

### 2026-10-30 执行状态

- 产品页与 2026-11-03 发布排期已确认。
- 页面原有 1 张中文画廊图。
- 四张 1270×760 英文画廊图已保存，产品页当前显示 5 张画廊图。
- Maker 首评已发布并显示在产品页。

```text
https://tubox.top/en?utm_source=producthunt&utm_medium=launch&utm_campaign=ph_20261103
```

## 产品页文案

Tagline：

```text
13 image tools that run privately in your browser
```

Short description：

```text
Tubox combines batch compression, on-device AI background removal and upscaling, ID photos, collages, GIF tools, EXIF cleanup and QR codes in one no-signup web app.
```

Topics：

```text
Design Tools · Photography · Privacy · Productivity · Web App
```

## Maker 首评

```text
Hey Product Hunt 👋

I built Tubox after repeatedly running into the same tradeoff: online image tools are convenient, but sensitive photos still have to be uploaded to a server.

Tubox takes the other route. Compression, background removal, AI upscaling, ID photos, collage layouts, GIF conversion and EXIF cleanup all run inside the browser. There is no account and no image-upload endpoint.

The engineering choices are deliberately visible:

• Batch processing runs through a Worker pool so the UI stays responsive.
• AI inference tries WebGPU and falls back to WASM.
• EXIF/XMP/IPTC segments are removed at the container level without re-encoding pixels.
• Models load only when you enter an AI tool.
• The whole project is AGPL-3.0 and can be self-hosted as a static site.

The tradeoff is that first-load model performance and older mobile devices still matter. I would especially value feedback on Safari/iOS, low-memory phones, and which workflow feels clunky on first use.

Try it here: https://tubox.top/en
Source: https://github.com/jackple/tubox
```

## 发布当天社交文案

X / LinkedIn：

```text
I just launched Tubox on Product Hunt.

It puts 13 image tools in one browser tab:
batch compression, AI cutout, 2×/4× upscaling, ID photos, collages, GIF conversion, EXIF removal and more.

No account. No image-upload endpoint. The processing runs on your device.

The most useful feedback right now is first-load friction and Safari/iOS compatibility, especially on phones.

https://tubox.top/en?utm_source=producthunt&utm_medium=social&utm_campaign=ph_20261103
```

Mastodon / Bluesky：

```text
Launched Tubox today: a privacy-first image toolbox that runs in the browser.

13 tools for compression, AI cutout/upscaling, ID photos, collage layouts, GIFs and EXIF cleanup. No sign-up; images stay on the device.

Looking for feedback on Safari/iOS and first-load performance:
https://tubox.top/en
```

## 回复评论的原则

- 技术问题给具体原因、限制和复现步骤，不讲空泛的“马上优化”。
- 功能请求先问真实工作流，不承诺日期。
- 隐私问题明确区分“图片不上传”和“页面、模型仍需下载”。
- 浏览器问题记录设备、系统版本、图片长边和错误信息。
- 感谢支持但不要引导用户“再来投一票”。
- 24 小时内尽量在 2–4 小时内回复；第二天汇总成公开 changelog。

通用回复：

```text
Thanks for trying it. Could you share the browser/device and roughly how large the source image is? The first AI run also downloads the model, so a slow first load and a slow inference step can look similar from the UI. I’m using those two details to separate a loading problem from a compute problem.
```

隐私问题回复：

```text
The image itself stays in the browser: decoding, canvas operations, workers and inference all happen on-device. The page and model files still need to be downloaded from a CDN, so “no image upload” is more accurate than “no network requests.” I’ve kept that distinction explicit on the site.
```

## 发布后 72 小时

1. 发布后 2 小时：检查 UTM 是否进入、首屏是否报错、404 和移动端下载按钮。
2. 发布后 6 小时：整理评论中的兼容性与首次使用问题。
3. 发布后 24 小时：发布简短的 launch retrospective，而不是重复宣传文案；写清哪类用户完成了导出。
4. 发布后 48 小时：把最常见的两个障碍修掉，再进入 Show HN 或技术社区。
5. 发布后 72 小时：给所有真实留言者回复修复结果，更新 AlternativeTo、SaaSHub 等目录描述。

## 当天记录表

| 时间 | 渠道 | 访问 | 开始使用 | 成功导出 | 主要问题 | 下一步 |
|---|---|---:|---:|---:|---|---|
| 16:00 | Product Hunt |  |  |  |  |  |
| 18:00 | X / LinkedIn |  |  |  |  |  |
| 22:00 | 中文社群 |  |  |  |  |  |
| 次日 | 复盘 |  |  |  |  |  |

访问量只能说明曝光。发布当天更值得看的是：**有多少人打开具体工具、上传了第一张图片、成功下载了结果。**
