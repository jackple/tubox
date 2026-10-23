import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { type ToolId, toolById } from '@/features/tools'
import { useMessages, useRouteLocale } from '@/i18n'
import { cn } from '@/lib/cn'
import { ToolIcon } from './ToolIcon'

interface Props {
  toolId: ToolId
  /** 标题栏右侧操作 */
  actions?: ReactNode
  /** 左侧素材栏 */
  left?: ReactNode
  /** 右侧参数面板 */
  inspector?: ReactNode
  /** 标题栏下方的子导航 */
  children: ReactNode
  stageClassName?: string
}

/**
 * 统一的工作台布局：
 * ┌────────────── header ──────────────┐
 * │ left │        stage        │ inspector │
 * └──────┴─────────────────────┴───────────┘
 * 小屏下纵向堆叠。
 */
export function ToolLayout({ toolId, actions, left, inspector, children, stageClassName }: Props) {
  const tool = toolById(toolId)
  const text = useMessages().tools[toolId]
  // 英文界面下装饰性英文名与标题重复，不再显示
  const showEn = useRouteLocale() !== 'en'
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 shrink-0 items-center gap-3.5 border-b border-line bg-panel/70 px-5 backdrop-blur-xl">
        <ToolIcon tool={tool} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-semibold leading-tight tracking-tight">{text.title}</h1>
            {showEn && <span className="eyebrow hidden !text-[10px] sm:inline">{tool.en}</span>}
          </div>
          <p className="mt-0.5 hidden truncate text-[12px] text-muted sm:block">{text.desc}</p>
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {left && (
          <aside className="shrink-0 border-b border-line bg-panel lg:w-[280px] lg:overflow-y-auto lg:border-b-0 lg:border-r">{left}</aside>
        )}
        <motion.section
          key={toolId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn('stage-dots relative min-h-[420px] min-w-0 flex-1 lg:min-h-0', stageClassName)}
        >
          {children}
        </motion.section>
        {inspector && (
          <aside className="flex shrink-0 flex-col border-t border-line bg-panel lg:w-[340px] lg:border-l lg:border-t-0">{inspector}</aside>
        )}
      </div>
    </div>
  )
}

/** 检查器容器：滚动内容 + 固定底栏 */
export function Inspector({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <>
      <div className="min-h-0 flex-1 lg:overflow-y-auto">{children}</div>
      {footer && <div className="sticky bottom-0 shrink-0 border-t border-line bg-panel/95 p-4 backdrop-blur">{footer}</div>}
    </>
  )
}
