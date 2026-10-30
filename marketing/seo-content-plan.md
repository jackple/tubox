# 搜索增长内容计划

当前已有 14 个工具页和十种语言，这是很好的底座。下一步重点不是继续生成大量相似页面，而是让每类真实搜索意图都有一个最合适的落地页，并能从内容直接进入工具。

## 页面原则

每个场景页首屏必须包含：

1. 一句明确结果，例如“把商品图批量压缩到 200KB 以内”。
2. 一个直接进入工具的主按钮。
3. 三到五分钟即可完成的步骤。
4. 一张真实前后对比或参数示例。
5. 文件格式、大小、浏览器限制。
6. 三条常见问题，回答用户真正会问的失败原因。

工具先出现，内容放在首屏之后。不要发布只有关键词替换、没有额外价值的批量页面。

## 第一批中文长尾页

| 搜索任务 | 目标页 | 建议标题 |
|---|---|---|
| 图片压缩到 200KB | `/batch` | 图片怎么压缩到 200KB？在线批量压缩与尺寸设置 |
| 手机照片删除位置 | `/exif` | 发图前如何删除照片 GPS 位置和设备信息 |
| 朋友圈九宫格 | `/collage/nine` | 一张图怎么切朋友圈九宫格？四宫格和三连图教程 |
| 证件照换蓝底 | `/id-photo` | 证件照怎么换蓝底？一寸、二寸与报名照尺寸 |
| 商品图统一尺寸 | `/batch` | 电商商品图怎么批量统一尺寸并控制体积 |
| 截图聊天记录拼长图 | `/collage/long` | 聊天记录截图怎么拼成一张长图 |
| 视频转 GIF 压缩 | `/video-to-gif` | 视频怎么转 GIF？截取片段、调整帧率和文件大小 |
| 视频转 GIF | `/video-to-gif` | MP4/MOV 转 GIF 怎么控制文件大小 |
| 照片 EXIF 是什么 | `/exif` | 照片 EXIF 会暴露什么？怎么查看和无损删除 |

## 第一批英文长尾页

| Search intent | Landing page | Angle |
|---|---|---|
| compress image to 200kb | `/en/batch` | Target-size compression without uploading |
| remove background from product photo | `/en/cutout` | Local AI cutout for e-commerce |
| upscale image 4x free | `/en/upscale` | Real-ESRGAN in browser, limits and comparison |
| 2x2 passport photo online | `/en/id-photo` | US passport size, background and print sheet |
| split image for Instagram grid | `/en/collage/nine` | 3×3 grid, correct tile ratio and ZIP |
| remove location from photo | `/en/exif` | EXIF/GPS deletion without recompression |
| MP4 to GIF without upload | `/en/video-to-gif` | Clip, frame rate, crop and size controls |
| make QR code with logo SVG | `/en/qr-code` | Static QR, vector export and contrast warnings |

## 已上线的内容节点

以下静态教程页已加入构建流程和 sitemap，每页都有独立标题、描述、canonical、中英文 alternate、HowTo/FAQ 结构化数据和工具入口：

| 语言 | 内容节点 |
|---|---|
| 中文 | `/guides/tupian-yasuo-200kb/` |
| 中文 | `/guides/shanchuxiaoxiang-gps/` |
| 中文 | `/guides/zhengjianzhao-huanlan-di/` |
| 中文 | `/guides/liaotian-jietu-changtu/` |
| English | `/en/guides/compress-image-to-200kb/` |
| English | `/en/guides/remove-photo-metadata/` |
| English | `/en/guides/passport-photo-2x2/` |
| English | `/en/guides/split-image-for-instagram-grid/` |
| English | `/en/guides/video-to-gif-file-size/` |

内容源在 `src/guides.ts`，静态页模板在 `scripts/guide-pages.ts`。新增内容后运行带 `VITE_SITE_URL=https://tubox.top` 的生产构建，sitemap 会自动加入新 URL。

## 内容结构模板

### 结果型教程

```text
H1：用户要完成的任务
第一段：可验证的完成方式 + 工具入口
步骤：3–5 步，配真实界面图
参数示例：输入格式、目标大小、预期耗时
常见失败：为什么压缩后仍超标 / 为什么扫码失败
隐私说明：图片如何处理、哪些资源需要联网
相关工具：2–3 个真实相关入口
```

## 站内链接

避免每篇文章都只链回首页。按任务相邻关系建立内部链接：

- 批量压缩 → 图片格式转换 → EXIF 清理；
- 证件照 → 抠图 → 打印排版 / 九宫格；
- 视频转 GIF → GIF 制作 → 社交封面；
- 截图标注 → 长图拼接 → 拼图 / 九宫格；

## 索引和搜索控制台

- Google Search Console 每周看一次“有曝光但低点击”的查询，优先改标题而不是堆关键词。
- Bing Webmaster 查看索引发现和抓取问题。
- 百度优先提交真正更新的工具页和场景页；配额不足时先提交转化率最高的页面。
- 每次内容发布后更新 sitemap 时间，并检查 canonical、hreflang 和静态正文。
- 一张页面只保留一个主搜索意图，避免证件照、拼图和 GIF 混在同一个长正文里。

## 90 天内容节奏

- 第 1–2 周：完成中文前 5 个高意图任务，观察收录和导出。
- 第 3–4 周：完成英文前 4 个任务，配合 Product Hunt 和 Show HN。
- 第 5–8 周：根据 Search Console 的真实查询补充 FAQ，不盲目增加新页。
- 第 9–12 周：只扩写已经获得曝光和导出的主题，淘汰没有需求和没有转化的页面。

每周最多新增两到三篇高质量场景内容。工具站的优势是用户马上能完成任务，内容必须强化这个优势，而不是把工具藏在长篇 SEO 文案下面。
