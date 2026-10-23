import { Fragment, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useLocale } from '@/stores/locale'
import { type Plural, type Vars, formatPlural, selectPlural, splitVars } from './format'
import { localizePath, splitLocale } from './locales'
import type { Messages } from './messages/zh-CN'

export { fmt } from './format'
export type { Messages }

/** 当前语言文案（组件内使用，切换语言时重渲染） */
export const useMessages = (): Messages => useLocale((s) => s.messages)!

/** 当前语言文案（store、toast 等非组件代码使用） */
export const getMessages = (): Messages => useLocale.getState().messages!

/** 按当前语言选择复数形式，并替换 {count} 及其它占位符 */
export const plural = (msg: Plural, count: number, vars?: Vars) => formatPlural(useLocale.getState().locale, msg, count, vars)

/** 按数量选出复数模板但不插值，配合 rich() 使用 */
export const pluralTemplate = (msg: Plural, count: number) => selectPlural(useLocale.getState().locale, msg, count)

/** 插值为 React 节点，如把数字加粗：rich(m.batch.output, { size: <b>…</b> }) */
export function rich(s: string, vars: Record<string, ReactNode>): ReactNode {
  return splitVars(s, vars).map((part, i) => <Fragment key={i}>{part}</Fragment>)
}

/** 以 id 为键的文案表查找，缺失时回退为 id */
export const label = (table: Record<string, string>, id: string) => table[id] ?? id

/** core/ 抛出的错误码（见 core/errors.ts）翻译为当前语言，其它错误原样返回 message */
export function errorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  return label(getMessages().errors, msg)
}

/** 当前路由所在语言 */
export const useRouteLocale = () => splitLocale(useLocation().pathname).locale

/** 把站内路径（如 /batch）转换为当前语言下的地址 */
export function useLocalizedPath() {
  const locale = useRouteLocale()
  return (path: string) => localizePath(path, locale)
}
