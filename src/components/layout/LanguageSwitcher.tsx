import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Languages } from 'lucide-react'
import { useMessages, useRouteLocale } from '@/i18n'
import { type Locale, locales, localizePath, splitLocale } from '@/i18n/locales'
import { cn } from '@/lib/cn'
import { savePreference } from '@/stores/locale'

/** 切换语言：跳到当前页面的对应语言地址，并记住选择 */
function useSwitchLocale() {
  const navigate = useNavigate()
  const { pathname, search, hash } = useLocation()
  return (l: Locale) => {
    savePreference(l)
    navigate(localizePath(splitLocale(pathname).path, l) + search + hash)
  }
}

function Options() {
  return locales.map((l) => (
    <option key={l.code} value={l.code} lang={l.htmlLang}>
      {l.label}
    </option>
  ))
}

/** 带图标的下拉框（侧边栏与小屏菜单共用） */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useRouteLocale()
  const change = useSwitchLocale()
  const label = useMessages().common.language

  return (
    <div className={cn('relative', className)}>
      <Languages className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
      <select
        aria-label={label}
        className="input h-8 cursor-pointer appearance-none pl-8 pr-8 text-[12px]"
        value={locale}
        onChange={(e) => change(e.target.value as Locale)}
      >
        <Options />
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
    </div>
  )
}
