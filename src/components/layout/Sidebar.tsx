import type { ComponentType, ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, CodeXml, Monitor, Moon, Sun } from 'lucide-react'
import { type GlyphProps, HomeGlyph } from '@/components/icons/ToolGlyphs'
import { Segmented } from '@/components/ui/Segmented'
import { SOURCE_URL } from '@/config'
import { toolGroups, tools } from '@/features/tools'
import { useLocalizedPath, useMessages } from '@/i18n'
import { cn } from '@/lib/cn'
import { type ThemeMode, useTheme } from '@/stores/theme'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Logo } from './Logo'

export function Sidebar() {
  const { mode, setMode } = useTheme()
  const m = useMessages()
  const to = useLocalizedPath()
  return (
    <aside className="relative hidden w-[240px] shrink-0 flex-col border-r border-line bg-panel/60 backdrop-blur-xl lg:flex">
      <div className="flex h-16 items-center px-5">
        <NavLink to={to('/')}>
          <Logo />
        </NavLink>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4 pt-3">
        <NavItem to={to('/')} end label={m.nav.overview} icon={HomeGlyph} />
        {toolGroups.map((g) => (
          <div key={g}>
            <div className="eyebrow mb-2 px-3 !text-[10px]">{m.toolGroups[g]}</div>
            <div className="space-y-px">
              {tools
                .filter((t) => t.group === g)
                .map((t) => (
                  <NavItem key={t.id} to={to(t.path)} label={m.tools[t.id].title} icon={t.icon} />
                ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-line p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="text-[12px] font-medium">{m.nav.privacyTitle}</div>
            <div className="text-[11px] text-muted">{m.nav.privacyDesc}</div>
          </div>
        </div>
        <a
          href={SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={m.legal.notice}
          className="group !mt-1 flex items-center gap-2 rounded-lg px-2 py-1 text-[11px] text-muted transition-colors hover:bg-fg/[0.04] hover:text-fg"
        >
          <CodeXml className="h-3.5 w-3.5" />
          {m.legal.openSource} · AGPL-3.0
          <ArrowUpRight className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
        <LanguageSwitcher />
        <Segmented<ThemeMode>
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'light', label: <Sun className="h-3.5 w-3.5" aria-label={m.common.themeLight} /> },
            { value: 'dark', label: <Moon className="h-3.5 w-3.5" aria-label={m.common.themeDark} /> },
            { value: 'system', label: <Monitor className="h-3.5 w-3.5" aria-label={m.common.themeSystem} /> },
          ]}
        />
      </div>
    </aside>
  )
}

function NavItem({ to, label, icon: Icon, end }: { to: string; label: ReactNode; icon: ComponentType<GlyphProps>; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className="block">
      {({ isActive }) => (
        <div
          className={cn(
            'relative flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors',
            isActive ? 'font-medium text-fg' : 'text-muted hover:bg-fg/[0.04] hover:text-fg',
          )}
        >
          {isActive && (
            <motion.span
              layoutId="nav-active"
              className="absolute inset-0 rounded-lg border border-line bg-panel shadow-[var(--highlight),0_1px_3px_rgb(0_0_0/0.06)] dark:bg-fg/[0.06]"
              transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
            />
          )}
          <Icon className={cn('relative h-[18px] w-[18px] shrink-0 transition-opacity', !isActive && 'opacity-70 grayscale')} />
          <span className="relative">{label}</span>
        </div>
      )}
    </NavLink>
  )
}
