export const FONT_SANS = '"Geist Variable", "PingFang SC", "HarmonyOS Sans SC", "Noto Sans SC", "Microsoft YaHei", system-ui, sans-serif'

export const FONT_SERIF = '"Songti SC", "Noto Serif SC", "Source Han Serif SC", "STSong", "SimSun", Georgia, serif'

export type FontKind = 'sans' | 'serif'

export const fontOf = (k: FontKind) => (k === 'serif' ? FONT_SERIF : FONT_SANS)
