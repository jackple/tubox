// 中文字体优先，其后补充日文、韩文字体，保证各语言的用户输入都有合适字形
export const FONT_SANS =
  '"Geist Variable", "PingFang SC", "HarmonyOS Sans SC", "Noto Sans SC", "Microsoft YaHei", "Hiragino Sans", "Yu Gothic", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans CJK KR", system-ui, sans-serif'

export const FONT_SERIF =
  '"Songti SC", "Noto Serif SC", "Source Han Serif SC", "STSong", "SimSun", "Hiragino Mincho ProN", "Yu Mincho", "AppleMyungjo", "Noto Serif KR", Georgia, serif'

export type FontKind = 'sans' | 'serif'

export const fontOf = (k: FontKind) => (k === 'serif' ? FONT_SERIF : FONT_SANS)
