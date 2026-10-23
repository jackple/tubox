export interface NameVars {
  name: string
  index: number
  width: number
  height: number
}

/** 显示名见 i18n/messages 的 batch.renameTokens */
export const renameTokens = [
  { id: 'name', token: '{name}' },
  { id: 'index', token: '{index:3}' },
  { id: 'size', token: '{w}x{h}' },
  { id: 'date', token: '{date}' },
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
