import { NavLink } from 'react-router-dom'
import { tools } from '@/features/tools'
import { cn } from '@/lib/cn'
import { LogoMark } from './Logo'

/** 小屏顶栏：横向滚动的工具切换 */
export function MobileNav() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-panel/80 px-4 backdrop-blur-xl lg:hidden">
      <NavLink to="/" className="text-fg">
        <LogoMark />
      </NavLink>
      <nav className="-mr-4 flex flex-1 gap-1 overflow-x-auto pr-4 [scrollbar-width:none]">
        {tools.map((t) => (
          <NavLink
            key={t.id}
            to={t.path}
            className={({ isActive }) =>
              cn(
                'flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px]',
                isActive ? 'border border-line bg-panel font-medium text-fg shadow-xs' : 'text-muted',
              )
            }
          >
            <t.icon className="h-4 w-4" />
            {t.title}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
