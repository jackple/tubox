import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { Portrait } from '@/components/common/Portrait'
import { IconTile } from '@/components/layout/ToolIcon'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { type Tool, toolById } from '@/features/tools'
import { cn } from '@/lib/cn'
import { ProductShot } from './ProductShot'
import { Scenery } from './Scenery'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
})

export default function HomePage() {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <Hero />
      <Stats />
      <Tools />
      <Privacy />
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <Logo />
          <p className="font-mono text-[11px] text-muted">© {new Date().getFullYear()} Tubox · Crafted for creators · 100% client-side</p>
        </div>
      </footer>
    </div>
  )
}

/* ───────────────────────── Hero ───────────────────────── */

function Hero() {
  return (
    <section className="relative isolate overflow-hidden pb-6">
      {/* 背景：细网格 + 顶部聚光 */}
      <div className="grid-lines pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(closest-side,rgb(var(--brand)/0.18),transparent)]" />

      <div className="mx-auto max-w-5xl px-6 pt-16 text-center sm:pt-24">
        <motion.div {...fadeUp(0)}>
          <Link
            to="/id-photo"
            className="group inline-flex h-8 items-center gap-2 rounded-full border border-line bg-panel/70 pl-1 pr-3 text-[12px] text-muted shadow-[var(--highlight),0_1px_2px_rgb(0_0_0/0.04)] backdrop-blur transition hover:border-fg/20 hover:text-fg"
          >
            <span className="rounded-full bg-fg px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-bg">NEW</span>
            证件照已支持端侧 AI 换底
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        <motion.h1
          {...fadeUp(0.08)}
          className="mx-auto mt-7 max-w-4xl text-[42px] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-[72px]"
        >
          <span className="text-metal">专业级图片处理</span>
          <br />
          <span className="text-metal">就在</span>
          <span className="text-gradient">浏览器</span>
          <span className="text-metal">里</span>
        </motion.h1>

        <motion.p {...fadeUp(0.16)} className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-muted sm:text-[17px]">
          批量压缩、证件照、拼图排版——六个专业工具，全部在你的设备上运行。
          <br className="hidden sm:block" />
          无需安装，无需上传，打开即用。
        </motion.p>

        <motion.div {...fadeUp(0.24)} className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/batch">
            <Button variant="primary" size="lg" className="px-6">
              开始使用 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/id-photo">
            <Button size="lg" className="px-6">
              制作证件照
            </Button>
          </Link>
        </motion.div>
        <motion.p {...fadeUp(0.3)} className="mt-5 font-mono text-[11px] tracking-wide text-muted/80">
          FREE · NO SIGN-UP · CHROME / SAFARI / EDGE
        </motion.p>
      </div>

      <div className="relative mt-16 px-4 sm:px-6">
        <ProductShot />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-bg" />
      </div>
    </section>
  )
}

/* ───────────────────────── Stats ───────────────────────── */

function Stats() {
  const items = [
    ['6', '专业工具'],
    ['23', '证件照规格'],
    ['18', '拼图模板'],
    ['0', '字节上传'],
  ]
  return (
    <section className="border-y border-line bg-panel/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
        {items.map(([n, l]) => (
          <div key={l} className="px-6 py-8 text-center">
            <div className="text-metal text-[40px] font-semibold tabular-nums tracking-[-0.04em]">{n}</div>
            <div className="mt-1 text-[13px] text-muted">{l}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ───────────────────────── Tools Bento ───────────────────────── */

function Tools() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="eyebrow">Toolkit</div>
        <h2 className="text-metal mt-3 text-[32px] font-semibold tracking-[-0.035em] sm:text-[40px]">一个工具箱，覆盖日常所需</h2>
        <p className="mt-3 text-[15px] text-muted">从电商修图到签证照片，从朋友圈九宫格到小红书封面。</p>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ToolCard tool={toolById('batch')} className="lg:col-span-2" visual={<BatchVisual />} />
        <ToolCard tool={toolById('idphoto')} className="lg:row-span-2" visual={<IdVisual />} tall />
        <ToolCard tool={toolById('long')} visual={<LongVisual />} />
        <ToolCard tool={toolById('grid')} visual={<GridVisual />} />
        <ToolCard tool={toolById('nine')} visual={<NineVisual />} />
        <ToolCard tool={toolById('social')} visual={<SocialVisual />} />
        <div className="flex flex-col justify-end rounded-2xl border border-dashed border-fg/15 p-6">
          <div className="eyebrow">Coming soon</div>
          <div className="mt-3 text-[15px] font-semibold tracking-tight">更多工具筹备中</div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">智能抠图、GIF 制作、EXIF 隐私清除、图片标注……</p>
        </div>
      </div>
    </section>
  )
}

function ToolCard({ tool, className, visual, tall }: { tool: Tool; className?: string; visual: ReactNode; tall?: boolean }) {
  const onMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <Link
      to={tool.path}
      onMouseMove={onMove}
      className={cn(
        'panel group relative flex flex-col overflow-hidden transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-fg/20',
        className,
      )}
    >
      {/* 跟随鼠标的聚光 */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(380px circle at var(--mx) var(--my), rgb(var(--brand) / 0.09), transparent 45%)' }}
      />
      <div
        className={cn(
          'stage-dots relative flex items-center justify-center overflow-hidden border-b border-line',
          tall ? 'min-h-[300px] flex-1' : 'h-[188px]',
        )}
      >
        {visual}
      </div>
      <div className="relative p-6">
        <div className="flex items-center gap-3">
          <IconTile icon={tool.icon} size="sm" />
          <h3 className="text-[15px] font-semibold tracking-tight">{tool.title}</h3>
          <ArrowUpRight className="ml-auto h-4 w-4 text-muted opacity-0 transition-all duration-300 group-hover:opacity-100" />
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">{tool.desc}</p>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
          {tool.chips.map((c) => (
            <span key={c} className="font-mono text-[11px] text-muted/80">
              {c}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

/* 卡片插画：中性、克制，只让「图片本身」有颜色 */

function BatchVisual() {
  const rows = [
    { name: 'DSC_0912.jpg', from: '6.2 MB', to: '486 KB', pct: '-92%', p: 'dusk' as const },
    { name: 'screenshot.png', from: '2.1 MB', to: '233 KB', pct: '-89%', p: 'ocean' as const },
    { name: 'product-03.webp', from: '1.4 MB', to: '198 KB', pct: '-86%', p: 'forest' as const },
  ]
  return (
    <div className="w-[78%] max-w-[440px] space-y-2">
      {rows.map((r, i) => (
        <div
          key={r.name}
          className="flex items-center gap-3 rounded-xl border border-line bg-panel p-2 shadow-[var(--highlight),0_1px_2px_rgb(0_0_0/0.05)] transition-transform duration-500 group-hover:translate-x-1"
          style={{ transitionDelay: `${i * 50}ms` }}
        >
          <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg">
            <Scenery palette={r.p} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-medium">{r.name}</div>
            <div className="font-mono text-[10px] text-muted">
              <span className="line-through opacity-60">{r.from}</span> → <span className="text-fg">{r.to}</span>
            </div>
          </div>
          <span className="font-mono text-[11px] font-medium text-success">{r.pct}</span>
        </div>
      ))}
    </div>
  )
}

function IdVisual() {
  const bgs = ['#FFFFFF', '#438EDB', '#E5322D']
  return (
    <div className="relative h-[220px] w-[260px]">
      {bgs.map((bg, i) => (
        <div
          key={bg}
          className="absolute top-1/2 aspect-[25/35] w-[118px] overflow-hidden rounded-[3px] shadow-stage"
          style={{
            background: bg,
            left: `${i * 70}px`,
            transform: `translateY(-50%) rotate(${(i - 1) * 7}deg) translateY(${i === 1 ? -10 : 0}px)`,
            zIndex: i === 1 ? 2 : 1,
          }}
        >
          <Portrait className="absolute bottom-0 left-1/2 w-[94%] -translate-x-1/2" shirt={['#334155', '#1F2937', '#111827'][i]} />
        </div>
      ))}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] tracking-wider text-muted">
        25×35mm · 295×413px · 300DPI
      </div>
    </div>
  )
}

function LongVisual() {
  const strips = [
    { p: 'ocean' as const, t: '今天天气真好' },
    { p: 'dusk' as const, t: '我们出发吧' },
    { p: 'sand' as const, t: '海边见！' },
  ]
  return (
    <div className="mt-12 w-[132px] overflow-hidden rounded-t-xl border border-b-0 border-line bg-panel p-1.5 shadow-soft transition-transform duration-700 group-hover:-translate-y-5">
      {strips.map((s, i) => (
        <div key={s.p} className={cn('relative overflow-hidden', i === 0 ? 'h-[72px] rounded-t-lg' : 'h-[24px]')}>
          <div className={cn('absolute inset-x-0 h-[72px]', i === 0 ? 'top-0' : 'bottom-0')}>
            <Scenery palette={s.p} />
          </div>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-black/45 px-1 text-[7px] text-white">
            {s.t}
          </span>
        </div>
      ))}
    </div>
  )
}

function GridVisual() {
  return (
    <div className="grid h-[136px] w-[136px] grid-cols-[3fr_2fr] grid-rows-2 gap-1 rounded-lg bg-white p-1 shadow-stage transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-105">
      <div className="row-span-2 overflow-hidden rounded-[4px]">
        <Scenery palette="dusk" />
      </div>
      <div className="overflow-hidden rounded-[4px]">
        <Scenery palette="ocean" sun={false} />
      </div>
      <div className="overflow-hidden rounded-[4px]">
        <Scenery palette="sand" />
      </div>
    </div>
  )
}

function NineVisual() {
  return (
    <div className="grid h-[136px] w-[136px] grid-cols-3 gap-[3px] transition-all duration-500 group-hover:gap-[6px]">
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="relative overflow-hidden rounded-[3px] shadow-sm">
          <div className="absolute h-[136px] w-[136px]" style={{ left: `${-(i % 3) * 100}%`, top: `${-Math.floor(i / 3) * 100}%` }}>
            <Scenery palette="ocean" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SocialVisual() {
  return (
    <div className="relative h-[150px] w-[112px] overflow-hidden rounded-lg shadow-stage transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-105">
      <Scenery palette="dusk" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
      <span className="absolute left-2 top-2 rounded-full bg-white/90 px-1.5 py-px text-[7px] font-semibold text-neutral-900">
        旅行日记
      </span>
      <div className="absolute bottom-2.5 left-2 text-[13px] font-bold leading-tight text-white">
        周末去海边
        <br />
        吹吹风
      </div>
    </div>
  )
}

/* ───────────────────────── Privacy ───────────────────────── */

function Privacy() {
  const points = ['所有解码、压缩与 AI 推理都在本机完成', '没有服务器、没有账号、没有追踪', '关闭页面即清空，不留任何痕迹']
  return (
    <section className="border-t border-line bg-panel/40">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 lg:grid-cols-2">
        <div>
          <div className="eyebrow">Privacy by design</div>
          <h2 className="text-metal mt-3 text-[32px] font-semibold leading-tight tracking-[-0.035em] sm:text-[40px]">
            你的图片，
            <br />
            从不离开你的设备。
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
            证件照、身份证明、私人相册——这些本就不该上传到陌生的服务器。图盒把整套处理流程搬进了浏览器。
          </p>
          <ul className="mt-8 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-[14px]">
                <span className="grid h-5 w-5 place-items-center rounded-full border border-line bg-panel">
                  <Check className="h-3 w-3 text-success" strokeWidth={2.5} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="panel overflow-hidden font-mono text-[12px]">
          <div className="flex h-10 items-center gap-2 border-b border-line bg-subtle/60 px-4">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-2.5 w-2.5 rounded-full bg-fg/15" />
            ))}
            <span className="ml-3 text-[11px] text-muted">session.log</span>
          </div>
          <div className="space-y-2 p-5 leading-relaxed">
            <div className="text-muted">$ tubox process ./photos --to webp</div>
            <LogLine k="decode" v="128 images" r="local" />
            <LogLine k="resize · encode" v="Web Worker × 8" r="1.8s" />
            <LogLine k="ai.segment" v="WebGPU" r="on-device" />
            <LogLine k="export" v="tubox-batch.zip" r="41.2 MB" />
            <div className="!my-4 border-t border-dashed border-line" />
            <div className="flex justify-between">
              <span className="text-muted">network.upload</span>
              <span className="font-semibold text-success">0 bytes</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function LogLine({ k, v, r }: { k: string; v: string; r: string }) {
  return (
    <div className="grid grid-cols-[16px_1fr_auto] gap-2">
      <span className="text-success">✓</span>
      <span>
        <span className="text-fg">{k}</span>
        <span className="ml-3 text-muted">{v}</span>
      </span>
      <span className="text-muted">{r}</span>
    </div>
  )
}
