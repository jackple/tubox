# English Editorial Drafts

These drafts are for original publication, not identical cross-posting. Adjust the introduction and examples to the audience of each publication.

## DEV Community

### Title

```text
What actually stays local in a browser image editor?
```

### Subtitle

```text
Building batch compression, AI cutout, upscaling and EXIF cleanup without an image-upload endpoint
```

### Tags

```text
#webdev #javascript #webgpu #privacy
```

### Body

```markdown
Most “online image editors” look the same from the outside: drag a file into a box, wait, and download a result. The architectural difference appears when you ask what happens between those steps.

I built [Tubox](https://tubox.top/en), a browser-based image toolbox. The selected image is decoded and processed on the user's device rather than uploaded to an application server. The page, JavaScript, fonts and AI model files still load over the network, but there is no image-upload endpoint.

That constraint changes several engineering decisions.

## Batch processing needs backpressure

A simple implementation might decode every dropped file at once and render each one into a canvas. With a folder of phone photos, that quickly becomes a memory problem.

The batch pipeline uses a small pool of Web Workers. The pool is bounded by `navigator.hardwareConcurrency - 1`, capped at six workers. Jobs wait for a free worker, and decoding, resizing, watermark rendering and encoding happen off the main thread.

The limit is not only about CPU. It also acts as a form of backpressure on decoded pixels. A 50-megapixel photo can consume several hundred megabytes while it exists as an RGBA bitmap, even if the exported JPEG is small.

The input and output types need to remain structured-clone compatible. Blobs can cross the Worker boundary; `ImageBitmap` and functions cannot be passed blindly. Each task has to define what is transferred and what is copied.

## Local does not mean “no network”

The privacy claim needs to be exact. “Images stay on your device” and “the site works completely offline” are different promises.

AI inference needs model files. A useful UX has to expose that first-run download instead of presenting a blank canvas that looks frozen. In Tubox, models load only when the relevant tool opens. Batch processing has no model dependency and can start immediately.

The same distinction applies to fonts and application chunks. A privacy-first product should describe the data flow precisely:

1. The selected image is not uploaded.
2. The page and model assets are downloaded.
3. Processing and export happen in the browser.
4. No account or server-side image library is created.

That wording is less impressive than “100% offline”, but it is testable and easier for users to trust.

## AI inference needs an honest fallback path

WebGPU is the preferred backend for background removal and upscaling. Device and browser support is uneven, so the application tries WebGPU and falls back to WebAssembly.

The fallback is not invisible magic. A first inference may be slow, especially on an older phone. A progress callback and cancellation path matter as much as the model choice. Users need to know whether the app is downloading, loading a model, or actually processing pixels.

For transparent upscaling, the edge colours must be extended before inference and the alpha channel handled separately. Otherwise transparent pixels can bleed dark or coloured halos into the subject.

## EXIF removal without recompression

Re-encoding an image just to remove metadata is wasteful. JPG, PNG, WebP and GIF use container structures that can be scanned for metadata segments.

The workflow is:

1. Parse the container.
2. Identify EXIF, XMP, IPTC, comments or PNG text chunks.
3. Remove the relevant segments.
4. Rebuild the container while preserving byte offsets and required structural data.

This approach avoids another lossy encode. It also exposes edge cases: orientation can live in EXIF, and ICC data affects colour interpretation. Removing everything may be correct for one workflow and wrong for another.

## What I would test next

The highest-value feedback is no longer “does it support another format?” It is whether the first real workflow is understandable on a phone:

1. Can a user tell when a model is downloading?
2. Can they recover if an inference backend fails?
3. Does the file actually download on Safari?
4. Does the result remain usable at the target file size?

Those questions are specific enough to test and fix. That is more useful than another feature card.

The source is AGPL-3.0: [github.com/jackple/tubox](https://github.com/jackple/tubox)
```

## Indie Hackers

### Title

```text
A browser-only image toolbox: traffic is not the same as product validation
```

### Body

```markdown
I launched [Tubox](https://tubox.top/en), a privacy-first image toolbox with batch compression, AI cutout, upscaling, ID photos, collages, GIF conversion and EXIF cleanup.

The product has no image-upload endpoint. The selected image is processed in the browser. This creates a clear technical story, but a technical story is not a business.

After the first distribution push, Cloudflare showed 408 visits and 927 page views in a 24-hour window. That number looks encouraging compared with the launch-day baseline, but it does not answer the question that matters: how many people selected a file, completed a processing task, and exported a result?

That missing step is now the main measurement problem.

## What the launch taught me

The early traction was spread across technical posts, a Chinese launch post and directory submissions. The next action is easy to get wrong: publish more links and mistake temporary traffic for retention.

The numbers I now want are:

- How many visitors open a specific tool?
- How many select a file?
- How many complete an export?
- Which tool or acquisition source produces a repeat visitor?

Cloudflare Web Analytics is useful for visits and page views, but it does not currently tell me whether a processing task succeeded. I am planning privacy-preserving product events that record only the tool, output format, duration bucket and browser capability, never filenames or image contents.

## The product tradeoff

“Everything in the browser” creates obvious value for private photos and sensitive product images. It also creates harder distribution:

- AI models must be downloaded on demand.
- Older phones have less memory and slower encoding.
- The product has to explain why a first AI run is not instant.
- A broad toolbox is harder to position than a single-purpose tool.

The opposite model, uploading every image to a server, would simplify some operations. It would also make privacy the thing users have to take on faith. The local-processing constraint remains a product decision, not a claim that every task is faster.

## What I am doing next

1. Publish task-specific guides for compression, metadata cleanup, passport photos and social grids.
2. Measure successful exports rather than page views alone.
3. Keep Product Hunt as a launch event and gate other communities on their own rules.
4. Ask for compatibility feedback instead of generic praise.
5. Use direct sponsors or transparent recommendations if monetisation begins, rather than quietly changing the privacy model.

The project is open source under AGPL-3.0. The useful question for this stage is not “how do I get more visits?” It is “which workflow brings a real person back to complete another file?”

Source: https://github.com/jackple/tubox
```

## SaaSHub submission fields

```text
Name: Tubox
Website: https://tubox.top
Short description: A privacy-first image toolbox with 13 browser-based tools for compression, background removal, AI upscaling, ID photos, collages, GIFs, EXIF cleanup and QR codes.
Categories: Image Editing, Photo Editing, Productivity, Privacy
Competitors: TinyPNG, remove.bg, Canva, Photopea
```

## Show HN

Use the existing Show HN draft in `marketing/channels.md`. Submit only after creating or logging into the account, and do not ask friends to upvote.

## 小众软件论坛

Title:

```text
【开发者自荐】图盒 Tubox：13 个图片工具在浏览器本地运行，不传原图
```

Body:

```text
最近把一个经常用到的图片处理流程整理成了一个在线工具箱，主要解决私人照片和未公开商品图不想先上传到陌生服务器的问题。

支持批量压缩、改尺寸、水印、格式转换、AI 抠图、AI 放大、证件照、拼图、九宫格、GIF、EXIF 清理和二维码。选中的图片由浏览器完成解码、处理和导出，没有图片上传接口，也没有账号系统；页面、字体和 AI 模型文件仍然需要联网下载。

技术上，批量任务使用 Worker 池限制并发，AI 推理优先 WebGPU、失败回退 WASM，EXIF 清理直接裁剪容器元数据段而不重新压缩画面。

项目以 AGPL-3.0 开源：https://github.com/jackple/tubox
在线使用：https://tubox.top

目前最想收集 Safari / 低配手机兼容性和首次模型加载的问题。如果有具体使用场景，欢迎直接回复。
```

## 少数派 Matrix

Article angle:

```text
把图片处理搬回浏览器：一次隐私优先的工程取舍
```

Use the DEV article as source material, but rewrite the opening around a Chinese user's real workflow and include local screenshots. Do not include an unsolicited product launch CTA in the first third of the article.
