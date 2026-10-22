import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Download, Grid2x2, Lock, Printer, RotateCcw, Search, ZoomIn } from 'lucide-react'
import { Portrait } from '@/components/common/Portrait'
import { IdPhotoGlyph } from '@/components/icons/ToolGlyphs'
import { cn } from '@/lib/cn'

const BGS = [
  { name: '蓝色', c: '#438EDB' },
  { name: '白色', c: '#FFFFFF' },
  { name: '红色', c: '#E5322D' },
  { name: '浅灰', c: '#EEEEEE' },
]

const SPECS = [
  ['一寸', '295×413'],
  ['二寸', '413×579'],
  ['美国签证', '600×600'],
  ['申根签证', '413×531'],
  ['教师资格证', '295×413'],
  ['英语四六级', '144×192'],
]

/** 首页产品图：用真实组件风格搭建的「证件照编辑器」，背景色会自动轮播 */
export function ProductShot() {
  const [bg, setBg] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setBg((i) => (i + 1) % BGS.length), 2600)
    return () => clearInterval(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 48, rotateX: 22 }}
      animate={{ opacity: 1, y: 0, rotateX: 8 }}
      transition={{ duration: 1.2, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformPerspective: 2200 }}
      className="relative mx-auto w-full max-w-[1080px]"
    >
      {/* 底部光晕 */}
      <div className="pointer-events-none absolute -inset-x-16 -top-10 bottom-10 -z-10 rounded-[50%] bg-[radial-gradient(closest-side,rgb(var(--brand)/0.28),transparent)] blur-2xl" />

      <div className="rounded-[22px] border border-line bg-fg/[0.03] p-2 shadow-lift backdrop-blur">
        <div className="overflow-hidden rounded-[15px] border border-line bg-panel">
          {/* 窗口标题栏 */}
          <div className="flex h-10 items-center gap-2 border-b border-line bg-subtle/60 px-4">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-2.5 w-2.5 rounded-full bg-fg/15" />
            ))}
            <div className="mx-auto flex h-6 items-center gap-1.5 rounded-md border border-line bg-panel px-3 font-mono text-[11px] text-muted">
              <Lock className="h-3 w-3" /> tubox.app/id-photo
            </div>
            <span className="w-[42px]" />
          </div>

          <div className="grid h-[420px] grid-cols-1 text-left md:grid-cols-[210px_1fr_250px]">
            {/* 规格列表 */}
            <aside className="hidden flex-col gap-1 border-r border-line p-3 md:flex">
              <div className="mb-2 flex h-8 items-center gap-2 rounded-md border border-line px-2.5 text-[11px] text-muted">
                <Search className="h-3.5 w-3.5" /> 搜索规格
              </div>
              {SPECS.map(([n, px], i) => (
                <div
                  key={n}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-2 py-1.5',
                    i === 0 && 'border border-line bg-panel shadow-[var(--highlight),0_1px_3px_rgb(0_0_0/0.08),0_0_0_1px_rgb(var(--fg))]',
                  )}
                >
                  <span
                    className="relative h-7 w-5 overflow-hidden rounded-[3px] ring-1 ring-black/10"
                    style={{ background: i === 0 ? BGS[bg].c : '#fff' }}
                  >
                    <Portrait className="absolute bottom-0 left-1/2 w-[92%] -translate-x-1/2" />
                  </span>
                  <div className="leading-tight">
                    <div className="text-[12px] font-medium">{n}</div>
                    <div className="font-mono text-[10px] text-muted">{px}</div>
                  </div>
                </div>
              ))}
            </aside>

            {/* 舞台 */}
            <div className="stage-dots relative grid place-items-center">
              <div className="relative">
                <motion.div
                  animate={{ backgroundColor: BGS[bg].c }}
                  transition={{ duration: 0.6 }}
                  className="relative aspect-[25/35] w-[188px] overflow-hidden rounded-[2px] shadow-stage"
                >
                  <Portrait className="absolute bottom-0 left-1/2 w-[94%] -translate-x-1/2" shirt="#1F2937" />
                  <div className="absolute inset-x-0 top-[10%] border-t border-dashed border-cyan-400/90" />
                  <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-cyan-400/60" />
                  <div className="absolute inset-x-0 top-[68%] h-[10%] bg-cyan-400/10" />
                </motion.div>
                <div className="absolute -right-28 top-8 hidden items-center gap-1.5 rounded-full border border-line bg-panel/90 px-2.5 py-1 text-[11px] shadow-soft backdrop-blur sm:flex">
                  <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-success text-white">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                  头部比例 <b className="font-mono font-medium">63%</b>
                </div>
                <div className="absolute -left-24 bottom-12 hidden items-center gap-1.5 rounded-full border border-line bg-panel/90 px-2.5 py-1 text-[11px] shadow-soft backdrop-blur sm:flex">
                  <IdPhotoGlyph className="h-3.5 w-3.5" /> AI 换底
                </div>
              </div>
              <div className="absolute bottom-4 flex items-center gap-1 rounded-xl border border-line bg-panel/90 p-1 text-[11px] text-muted shadow-soft backdrop-blur">
                <span className="flex items-center gap-1 px-2 py-1">
                  <ZoomIn className="h-3.5 w-3.5" /> <span className="font-mono">100%</span>
                </span>
                <span className="h-4 w-px bg-line" />
                <span className="flex items-center gap-1 px-2 py-1">
                  <RotateCcw className="h-3.5 w-3.5" /> 自动构图
                </span>
                <span className="flex items-center gap-1 rounded-md bg-fg/[0.06] px-2 py-1 text-fg">
                  <Grid2x2 className="h-3.5 w-3.5" /> 参考线
                </span>
              </div>
            </div>

            {/* 检查器 */}
            <aside className="hidden flex-col border-l border-line md:flex">
              <div className="space-y-2.5 border-b border-line p-4">
                <div className="text-[12px] font-medium">背景颜色</div>
                <div className="flex gap-2">
                  {BGS.map((b, i) => (
                    <span
                      key={b.c}
                      className={cn(
                        'h-6 w-6 rounded-full ring-offset-2 ring-offset-panel transition-all',
                        i === bg ? 'ring-2 ring-fg' : 'ring-1 ring-line',
                      )}
                      style={{ background: b.c }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-3 border-b border-line p-4">
                {[
                  ['缩放', 62],
                  ['旋转', 50],
                ].map(([l, v]) => (
                  <div key={l} className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-muted">
                      {l}
                      <span className="font-mono">{l === '缩放' ? '100%' : '0°'}</span>
                    </div>
                    <div className="relative h-1 rounded-full bg-line">
                      <div className="h-full rounded-full bg-fg" style={{ width: `${v}%` }} />
                      <span
                        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line bg-white shadow"
                        style={{ left: `${v}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex-1 p-4">
                <div className="divide-y divide-line rounded-lg border border-line">
                  {[
                    ['像素尺寸', '295×413'],
                    ['背景颜色', BGS[bg].name],
                    ['文件体积', '38 KB'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 px-2.5 py-1.5 text-[11px]">
                      <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-success text-white">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                      <span className="text-muted">{k}</span>
                      <span className="ml-auto font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-line p-3">
                <span className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-line text-[11px] font-medium">
                  <Printer className="h-3.5 w-3.5" /> 冲印排版
                </span>
                <span className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-fg text-[11px] font-medium text-bg">
                  <Download className="h-3.5 w-3.5" /> 下载
                </span>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
