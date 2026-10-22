export interface NameVars {
  name: string
  index: number
  width: number
  height: number
}

export const renameTokens = [
  { token: '{name}', label: '原文件名' },
  { token: '{index:3}', label: '序号 001' },
  { token: '{w}x{h}', label: '尺寸' },
  { token: '{date}', label: '日期' },
]

/**
 * 文件名模板：{name} {index} {index:3} {w} {h} {date}
 * 例：「旅行_{index:3}_{w}x{h}」→「旅行_001_1920x1080.jpg」
 */
export function renderFileName(template: string, v: NameVars, ext: string): string {
  const d = new Date()
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const out = (template || '{name}').replace(/\{(name|index|w|h|date)(?::(\d))?\}/g, (_, key: string, pad?: string) => {
    switch (key) {
      case 'name':
        return v.name
      case 'index':
        return String(v.index + 1).padStart(pad ? Number(pad) : 1, '0')
      case 'w':
        return String(v.width)
      case 'h':
        return String(v.height)
      default:
        return date
    }
  })
  const safe = out.replace(/[\\/:*?"<>|]+/g, '_').trim()
  return `${safe || 'image'}.${ext}`
}

export const stripExt = (name: string) => name.replace(/\.[^.]+$/, '')
