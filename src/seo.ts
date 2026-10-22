/**
 * 各页面 SEO 信息：标题、描述、关键词、结构化数据。
 * 纯数据 + 纯函数，不依赖 React / import.meta.env —— 同时被运行时（useSeo）和构建时（vite.config.ts 预渲染每个路由的 HTML）使用。
 */

export const SITE_NAME = '图盒 Tubox'

export interface PageSeo {
  /** 路由路径（不含 base），与 App.tsx 的路由一致 */
  path: string
  /** 页面名，用于面包屑和静态导航 */
  name: string
  /** <title>，不含站点名后缀 */
  title: string
  description: string
  keywords: string[]
  /** 预渲染到静态 HTML 中的功能要点，供不执行 JS 的爬虫（如百度）读取 */
  features: string[]
}

export const pages: PageSeo[] = [
  {
    path: '/',
    name: '首页',
    title: '免费在线图片工具箱：批量压缩、证件照、拼图、九宫格',
    description:
      '图盒 Tubox 是免费的在线图片处理工具箱：批量压缩改尺寸加水印、证件照 AI 换底、长图拼接、拼图、九宫格切图、小红书封面排版。全部在浏览器本地处理，图片不上传，无需注册。',
    keywords: ['在线图片工具', '图片处理', '图片压缩', '证件照制作', '在线拼图', '九宫格切图', '长图拼接', '小红书封面'],
    features: ['图片在浏览器本地处理，不上传服务器', '免费使用，无需注册登录', '支持 JPG / PNG / WebP / AVIF'],
  },
  {
    path: '/batch',
    name: '批量处理',
    title: '批量图片处理：在线批量压缩、改尺寸、加水印、转格式',
    description:
      '免费在线批量处理图片：统一尺寸、按目标体积压缩（如压到 200KB 以内）、文字 / Logo 水印、JPG / PNG / WebP / AVIF 格式互转、批量重命名，ZIP 打包下载。浏览器多线程本地处理，图片不上传。',
    keywords: ['批量压缩图片', '图片压缩到指定大小', '批量修改图片尺寸', '图片加水印', '图片格式转换', 'WebP 转 JPG', '批量重命名图片'],
    features: [
      '统一尺寸：按长边、适应、裁切填充、固定宽高或百分比缩放',
      '按目标体积压缩，把图片压到指定 KB 以内',
      '文字 / Logo 水印，九宫格定位与斜向平铺防盗',
      'JPG / PNG / WebP / AVIF 格式互转',
      '文件名模板批量重命名，ZIP 一键打包下载',
    ],
  },
  {
    path: '/id-photo',
    name: '证件照',
    title: '证件照在线制作：一寸二寸照片、签证照、AI 换底色',
    description:
      '免费在线制作证件照：一寸、二寸、身份证、护照，美国 / 申根 / 日本 / 韩国等签证照，国考、教资、四六级报名照等 20+ 规格。AI 抠图换红底 / 蓝底 / 白底，自动构图，压缩到指定体积，支持 6 寸 / A4 冲印排版。照片仅在本地处理。',
    keywords: ['证件照制作', '一寸照片', '二寸照片', '证件照换底色', '签证照片', '考试报名照片', '证件照排版打印', '蓝底照片'],
    features: [
      '20+ 规格：一寸、二寸、身份证、护照 / 港澳通行证、驾驶证、社保卡',
      '签证照：美国、申根、日本、韩国、英国、加拿大、澳大利亚',
      '考试报名照：国考、教师资格证、四六级、计算机等级、考研、普通话',
      'AI 人像抠图，一键换白底 / 蓝底 / 红底 / 渐变底',
      '人脸定位自动构图，体积不达标自动压缩',
      '6 寸 / 5 寸 / A4 冲印排版，写入 300 DPI',
    ],
  },
  {
    path: '/collage/long',
    name: '长图拼接',
    title: '长图拼接：在线拼长图、聊天记录拼接、电影字幕拼图',
    description:
      '免费在线长图拼接：多张截图竖向或横向拼成一张长图，支持聊天记录拼接、电影台词字幕拼接，可调间距、边距、圆角与背景色，自动统一宽度。本地处理，图片不上传。',
    keywords: ['长图拼接', '截图拼接', '聊天记录拼长图', '电影字幕拼接', '图片竖向拼接', '图片横向拼接'],
    features: [
      '竖向 / 横向拼接，自动统一宽度或高度',
      '电影字幕拼接：首图完整，其余只保留底部字幕条',
      '自定义间距、边距、圆角与背景色',
      '超长图自动缩放，避免超出浏览器画布上限',
    ],
  },
  {
    path: '/collage/grid',
    name: '自由拼图',
    title: '在线拼图：多图拼接模板，2-9 张照片拼成一张',
    description:
      '免费在线拼图工具：18 种拼图模板支持 2-9 张照片，1:1、3:4、9:16 等 6 种画布比例，自定义间距、圆角和背景，按照片数量自动推荐模板。本地处理，图片不上传。',
    keywords: ['在线拼图', '照片拼图', '多图拼接', '拼图模板', '图片拼接', '朋友圈拼图'],
    features: ['18 种拼图模板，支持 2-9 张照片', '6 种画布比例：1:1、3:4、9:16 等', '自定义间距、圆角与背景', '按照片数量自动推荐模板'],
  },
  {
    path: '/collage/nine',
    name: '九宫格切图',
    title: '九宫格切图：朋友圈九宫格图片在线切割',
    description:
      '免费在线九宫格切图：一张大图切成朋友圈九宫格、四宫格、六宫格或横竖三连图，拖拽调整取景，预览朋友圈间隙效果，一键打包下载。本地处理，图片不上传。',
    keywords: ['九宫格切图', '朋友圈九宫格', '九宫格图片制作', '图片切割', '四宫格', '三连图'],
    features: ['九宫格 / 四宫格 / 六宫格 / 横三连 / 竖三连', '拖拽调整取景范围', '预览朋友圈间隙效果', '按发布顺序编号，一键 ZIP 打包'],
  },
  {
    path: '/collage/social',
    name: '社交排版',
    title: '社交排版：小红书封面、公众号头图、朋友圈配图在线制作',
    description:
      '免费在线制作小红书封面、公众号封面头图、朋友圈、视频号、微博配图：6 种版式、6 套配色、2 种字体，输入文字即可生成图文排版。本地处理，图片不上传。',
    keywords: ['小红书封面制作', '公众号封面', '公众号头图', '朋友圈配图', '视频号封面', '图文排版'],
    features: [
      '小红书 3:4、朋友圈 1:1、视频号 9:16、微博 16:9、公众号 2.35:1',
      '大字封面、拍立得、杂志封面、留白卡片、多图拼贴、文字卡片 6 种版式',
      '6 套配色 × 2 种字体',
      '输入标题文字即可生成，原始分辨率导出',
    ],
  },
]

export const pageByPath = (path: string) => {
  const p = path.replace(/\/+$/, '') || '/'
  return pages.find((x) => x.path === p) ?? pages[0]
}

export const fullTitle = (page: PageSeo) => (page.path === '/' ? `${SITE_NAME} · ${page.title}` : `${page.title} - ${SITE_NAME}`)

/** 拼接绝对地址；siteUrl 为空时返回 undefined（不输出 canonical / og:url） */
export function absoluteUrl(siteUrl: string | undefined, base: string, path: string) {
  if (!siteUrl) return undefined
  const b = base.replace(/\/+$/, '')
  return siteUrl.replace(/\/+$/, '') + b + (path === '/' ? '/' : path)
}

/** JSON-LD 结构化数据：首页为 WebSite，工具页为 WebApplication + 面包屑 */
export function structuredData(page: PageSeo, siteUrl: string | undefined, base: string) {
  const url = absoluteUrl(siteUrl, base, page.path)
  const home = absoluteUrl(siteUrl, base, '/')
  if (page.path === '/') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      description: page.description,
      inLanguage: 'zh-CN',
      ...(url && { url }),
    }
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: `${page.name} - ${SITE_NAME}`,
        description: page.description,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        browserRequirements: 'Requires JavaScript',
        inLanguage: 'zh-CN',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
        featureList: page.features,
        ...(url && { url }),
      },
      ...(url && home
        ? [
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: SITE_NAME, item: home },
                { '@type': 'ListItem', position: 2, name: page.name, item: url },
              ],
            },
          ]
        : []),
    ],
  }
}
