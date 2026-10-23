/**
 * 全部语言文案的静态汇总，仅供构建时（scripts/seo-plugin.ts）使用。
 * 运行时请勿导入 —— 会把所有语言打进主包；运行时由 stores/locale 按需加载。
 */
import type { Locale } from './locales'
import type { Messages } from './messages/zh-CN'
import de from './messages/de'
import en from './messages/en'
import es from './messages/es'
import fr from './messages/fr'
import ja from './messages/ja'
import ko from './messages/ko'
import pt from './messages/pt'
import ru from './messages/ru'
import zhCN from './messages/zh-CN'
import zhTW from './messages/zh-TW'

export const catalog: Record<Locale, Messages> = { 'zh-CN': zhCN, 'zh-TW': zhTW, en, ja, ko, es, fr, de, pt, ru }
