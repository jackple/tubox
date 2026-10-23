/** 文案插值与复数：纯函数，不依赖 React / store */

/** 复数文案，分类同 Intl.PluralRules（中日韩只需 other；俄语需要 one / few / many） */
export interface Plural {
  zero?: string
  one?: string
  two?: string
  few?: string
  many?: string
  other: string
}

/** 在源语言文件中标记复数文案，使其类型为 Plural，其它语言才能补充 one / few 等分类 */
export const p = (x: Plural): Plural => x

export type Vars = Record<string, string | number>

/** 替换 {name} 占位符；未提供的占位符原样保留 */
export function fmt(s: string, vars?: Vars): string {
  if (!vars) return s
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
}

const rules = new Map<string, Intl.PluralRules>()

/** 按数量选出复数形式的模板（未插值） */
export function selectPlural(locale: string, msg: Plural, count: number): string {
  let r = rules.get(locale)
  if (!r) rules.set(locale, (r = new Intl.PluralRules(locale)))
  return (count === 0 && msg.zero) || msg[r.select(count)] || msg.other
}

export const formatPlural = (locale: string, msg: Plural, count: number, vars?: Vars) =>
  fmt(selectPlural(locale, msg, count), { count, ...vars })

/** 拆分占位符，供 React 层把 {x} 替换为元素（如加粗数字） */
export function splitVars<T>(s: string, vars: Record<string, T>): (string | T)[] {
  return s.split(/(\{\w+\})/).map((part) => {
    const k = /^\{(\w+)\}$/.exec(part)?.[1]
    return k && k in vars ? vars[k] : part
  })
}
