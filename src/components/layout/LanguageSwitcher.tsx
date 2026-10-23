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

/** 侧边栏：带图标的下拉框；compact 为小屏顶栏的图标按钮（原生 select 覆盖其上） */
export function LanguageSwitcher({ compact, className }: { compact?: boolean; className?: string }) {
  const locale = useRouteLocale()
  const change = useSwitchLocale()
  const label = useMessages().common.language

  if (compact)
    return (
      <label
        title={label}
        className={cn('relative grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-subtle hover:text-fg', className)}
      >
        <Languages className="h-4 w-4" />
        <select
          aria-label={label}
          className="absolute inset-0 cursor-pointer opacity-0"
          value={locale}
          onChange={(e) => change(e.target.value as Locale)}
        >
          <Options />
        </select>
      </label>
    )

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
