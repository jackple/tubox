# 渠道执行状态（2026-10-30）

## 已完成

| 渠道 | 动作 | 验证 |
|---|---|---|
| 网站 | 新增 9 个中英文长尾教程页 | 生产构建通过，静态 HTML、canonical、hreflang、HowTo/FAQ 数据已生成 |
| 网站 | sitemap 从 140 个 URL 增加到 151 个 | 本地构建校验通过 |
| Google Search Console | 查看效果、收录和 sitemap | 当前 17 页已编入索引、4 页“已抓取但尚未编入索引” |
| Bing / IndexNow | 提交 sitemap 中的全部 151 个 URL | IndexNow 返回 HTTP 200 |
| Bing | 验证当前收录 | `site:tubox.top` 返回约 7 个结果 |
| Google | 验证当前收录 | `site:tubox.top` 返回多页结果 |
| AlternativeTo | 查询产品是否已上线 | `/software/tubox/` 仍为 404，原提交仍在审核或未通过 |
| Product Hunt | 上传四张英文画廊图到编辑草稿 | 已上传，尚未点击 `Save media` |

## 已准备，等待账号或公开操作确认

| 渠道 | 当前阻塞 | 已有材料 |
|---|---|---|
| Product Hunt | 保存媒体、检查首评和发布日 | `product-hunt-launch.md` 与四张 1270×760 图片 |
| Google Search Console | 部署后重新提交 sitemap、请求核心 URL 编入索引 | Google 账号已登录，站点已验证 |
| Show HN | 当前浏览器未登录 Hacker News | `channels.md` 中已有 Show HN 标题和正文 |
| DEV Community | 当前浏览器未登录 DEV | `editorial-drafts.md` 中已有完整英文工程文章 |
| Indie Hackers | 当前浏览器未登录 Indie Hackers | `editorial-drafts.md` 中已有完整英文复盘 |
| SaaSHub | 首步可填写网站，后续需要产品域名邮箱验证 | `editorial-drafts.md` 中已有完整产品字段 |
| 小众软件论坛 | 当前浏览器未登录；论坛要求使用模板并人工审核 | `editorial-drafts.md` 中已有开发者自荐稿 |
| 少数派 Matrix | 微信授权后要求绑定手机号，当前未完成账号绑定 | `editorial-drafts.md` 中已有文章角度 |
| Awesome 列表 | 需要逐库检查收录规则并创建 PR | `outreach-kit.md` 中已有 PR 文案模板 |

## 推荐执行顺序

1. 保存 Product Hunt 画廊，检查首评和 11 月 3 日排期。
2. 在 Search Console 重新提交 sitemap，并用“网址检查”提交 3 个英文教程页。
3. 登录 DEV 和 Indie Hackers 后分别发布不同角度的原文，不同步复制。
4. 登录小众软件论坛，按“开发者自荐”模板提交一次。
5. 绑定少数派账号后投 Matrix 教程，不把产品发布稿当文章提交。
6. 完成 SaaSHub 网站和产品资料，等待邮箱验证。
所有尚未登录或需要新账号的渠道都不应自动注册、自动群发或购买互动。
