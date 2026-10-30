import { type ComponentType, type ReactNode, useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CodeXml, Menu, X } from 'lucide-react'
import { type GlyphProps, HomeGlyph } from '@/components/icons/ToolGlyphs'
import { SOURCE_URL } from '@/config'
import { toolGroups, tools } from '@/features/tools'
import { useLocalizedPath, useMessages } from '@/i18n'
import { cn } from '@/lib/cn'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Logo } from './Logo'
import { ThemeSwitcher } from './Sidebar'

/** 小屏顶栏：Logo + 菜单按钮，展开后按分组列出全部工具，并放置语言与主题设置 */
export function MobileNav() {
  const m = useMessages()
  const to = useLocalizedPath()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  // 切换页面（包括切换语言）后自动收起
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <header className="relative z-50 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-panel/80 px-4 backdrop-blur-xl lg:hidden">
        <NavLink to={to('/')}>
          <Logo />
        </NavLink>
        <button
          type="button"
          aria-label={m.nav.menu}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            '-mr-1.5 grid h-9 w-9 place-items-center rounded-lg transition-colors',
            open ? 'bg-fg/[0.06] text-fg' : 'text-muted hover:bg-fg/[0.04] hover:text-fg',
          )}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-x-0 bottom-0 top-14 z-40 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              id="mobile-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative flex max-h-full flex-col overflow-hidden rounded-b-2xl border-b border-line bg-panel shadow-xl"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-5 pt-4">
                <MenuItem to={to('/')} end label={m.nav.overview} icon={HomeGlyph} />
                {toolGroups.map((g) => (
                  <section key={g}>
                    <div className="eyebrow mb-2 px-1 !text-[10px]">{m.toolGroups[g]}</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {tools
                        .filter((t) => t.group === g)
                        .map((t) => (
                          <MenuItem key={t.id} to={to(t.path)} label={m.tools[t.id].title} icon={t.icon} />
                        ))}
                    </div>
                  </section>
                ))}
              </div>

              <div className="space-y-3 border-t border-line px-4 pb-4 pt-3">
                <div className="flex items-center gap-2">
                  <LanguageSwitcher className="min-w-0 flex-1" />
                  <ThemeSwitcher className="shrink-0" />
                </div>
                <div className="flex items-center justify-between gap-3 text-[11px] text-muted">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                    <span className="truncate">{m.nav.privacyDesc}</span>
                  </span>
                  <a
                    href={SOURCE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={m.legal.notice}
                    className="flex shrink-0 items-center gap-1.5 hover:text-fg"
                  >
                    <CodeXml className="h-3.5 w-3.5" />
                    {m.legal.openSource} · AGPL-3.0
                  </a>
                </div>
              </div>
            </motion.nav>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

function MenuItem({ to, label, icon: Icon, end }: { to: string; label: ReactNode; icon: ComponentType<GlyphProps>; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-2 text-[13px] leading-tight transition-colors',
          isActive
            ? 'border-brand/30 bg-brand/[0.07] font-medium text-fg'
            : 'border-transparent bg-fg/[0.03] text-fg/80 active:bg-fg/[0.06]',
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="min-w-0">{label}</span>
    </NavLink>
  )
}
