import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Check, Play } from 'lucide-react'
import { Portrait } from '@/components/common/Portrait'
import { IconTile } from '@/components/layout/ToolIcon'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { SOURCE_URL, THIRD_PARTY_LICENSES_URL } from '@/config'
import { gridTemplates } from '@/core/collage/templates'
import { photoSpecs } from '@/core/idphoto/specs'
import { type Tool, toolById, tools } from '@/features/tools'
import { useLocalizedPath, useMessages, useRouteLocale } from '@/i18n'
import { cn } from '@/lib/cn'
import { ProductShot } from './ProductShot'
import { Scenery } from './Scenery'

const revealDelay = (delay = 0): CSSProperties => ({ animationDelay: `${delay}ms` })

export default function HomePage() {
  const legal = useMessages().legal
  const locale = useRouteLocale()
  const guidesHref = locale === 'zh-CN' || locale === 'zh-TW' ? '/guides/' : '/en/guides/'
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <Hero />
      <Stats />
      <Tools />
      <Privacy />
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <Logo />
          <div className="space-y-1 text-center sm:text-right">
            <p className="font-mono text-[11px] text-muted">
              © {new Date().getFullYear()} Tubox contributors · Crafted for creators · 100% client-side
            </p>
            {/* AGPL-3.0：适当法律声明 + 源代码入口 */}
            <p className="text-[11px] text-muted">
              <a href={guidesHref} className="underline-offset-2 hover:text-fg hover:underline">
                {legal.guides}
              </a>
              {' · '}
              {legal.notice}{' '}
              <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-fg hover:underline">
                {legal.sourceCode}
              </a>
              {' · '}
              <a
                href={THIRD_PARTY_LICENSES_URL}
                target="_blank"
                rel="noopener"
                className="underline-offset-2 hover:text-fg hover:underline"
              >
                {legal.thirdParty}
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ───────────────────────── Hero ───────────────────────── */

function Hero() {
  const m = useMessages().home
  const to = useLocalizedPath()
  return (
    <section className="relative isolate overflow-hidden pb-6">
      {/* 背景：细网格 + 顶部聚光 */}
      <div className="grid-lines pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(closest-side,rgb(var(--brand)/0.18),transparent)]" />

      <div className="mx-auto max-w-5xl px-6 pt-16 text-center sm:pt-24">
        <div className="home-reveal">
          <Link
            to={to('/id-photo')}
            className="group inline-flex h-8 items-center gap-2 rounded-full border border-line bg-panel/70 pl-1 pr-3 text-[12px] text-muted shadow-[var(--highlight),0_1px_2px_rgb(0_0_0/0.04)] backdrop-blur transition hover:border-fg/20 hover:text-fg"
          >
            <span className="rounded-full bg-fg px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-bg">NEW</span>
            {m.badge}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <h1
          className="home-reveal mx-auto mt-7 max-w-4xl text-[42px] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-[72px]"
          style={revealDelay(80)}
        >
          <span className="text-metal">{m.heroLine1}</span>
          <br />
          <span className="text-metal">{m.heroBefore}</span>
          <span className="text-gradient">{m.heroHighlight}</span>
          <span className="text-metal">{m.heroAfter}</span>
        </h1>

        <p className="home-reveal mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-muted sm:text-[17px]" style={revealDelay(160)}>
          {m.heroDesc1}
          <br className="hidden sm:block" /> {m.heroDesc2}
        </p>

        <div className="home-reveal mt-9 flex flex-wrap justify-center gap-3" style={revealDelay(240)}>
          <Link to={to('/batch')}>
            <Button variant="primary" size="lg" className="px-6">
              {m.start} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={to('/id-photo')}>
            <Button size="lg" className="px-6">
              {m.makeIdPhoto}
            </Button>
          </Link>
        </div>
        <p className="home-reveal mt-5 font-mono text-[11px] tracking-wide text-muted/80" style={revealDelay(300)}>
          FREE · NO SIGN-UP · CHROME / SAFARI / EDGE
        </p>
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
  const s = useMessages().home.stats
  const items = [
    [String(tools.length), s.tools],
    [String(photoSpecs.length), s.specs],
    [String(gridTemplates.length), s.templates],
    ['0', s.upload],
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
  const m = useMessages().home
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="eyebrow">Toolkit</div>
        <h2 className="text-metal mt-3 text-[32px] font-semibold tracking-[-0.035em] sm:text-[40px]">{m.toolsTitle}</h2>
        <p className="mt-3 text-[15px] text-muted">{m.toolsDesc}</p>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ToolCard tool={toolById('batch')} className="lg:col-span-2" visual={<BatchVisual />} />
        <ToolCard tool={toolById('idphoto')} className="lg:row-span-2" visual={<IdVisual />} tall />
        <ToolCard tool={toolById('cutout')} visual={<CutoutVisual />} />
        <ToolCard tool={toolById('upscale')} visual={<UpscaleVisual />} />
        <ToolCard tool={toolById('long')} visual={<LongVisual />} />
        <ToolCard tool={toolById('grid')} visual={<GridVisual />} />
        <ToolCard tool={toolById('nine')} visual={<NineVisual />} />
        <ToolCard tool={toolById('social')} visual={<SocialVisual />} />
        <ToolCard tool={toolById('gif')} visual={<GifVisual />} />
        <ToolCard tool={toolById('videogif')} visual={<VideoGifVisual />} />
        <ToolCard tool={toolById('exif')} visual={<ExifVisual />} />
        <ToolCard tool={toolById('annotate')} visual={<AnnotateVisual />} />
        <ToolCard tool={toolById('qrcode')} visual={<QrVisual />} />
        <div className="flex flex-col justify-end rounded-2xl border border-dashed border-fg/15 p-6 lg:col-span-3">
          <div className="eyebrow">Coming soon</div>
          <div className="mt-3 text-[15px] font-semibold tracking-tight">{m.soonTitle}</div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{m.soonDesc}</p>
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
  const text = useMessages().tools[tool.id]
  const to = useLocalizedPath()
  return (
    <Link
      to={to(tool.path)}
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
          <h3 className="text-[15px] font-semibold tracking-tight">{text.title}</h3>
          <ArrowUpRight className="ml-auto h-4 w-4 text-muted opacity-0 transition-all duration-300 group-hover:opacity-100" />
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">{text.desc}</p>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
          {text.chips.map((c) => (
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

function CutoutVisual() {
  return (
    <div className="relative h-[150px] w-[150px] overflow-hidden rounded-lg shadow-stage transition-transform duration-500 group-hover:scale-105">
      <div className="checker absolute inset-0" />
      <div className="absolute inset-0 transition-[clip-path] duration-700 [clip-path:inset(0_50%_0_0)] group-hover:[clip-path:inset(0_88%_0_0)]">
        <Scenery palette="ocean" />
      </div>
      <Portrait className="absolute bottom-0 left-1/2 w-[78%] -translate-x-1/2" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/90 shadow-[0_0_0_1px_rgb(0_0_0/0.08)] transition-[left] duration-700 group-hover:left-[12%]" />
    </div>
  )
}

function UpscaleVisual() {
  return (
    <div className="relative h-[140px] w-[196px] overflow-hidden rounded-lg shadow-stage transition-transform duration-500 group-hover:scale-105">
      <Scenery palette="forest" />
      {/* 左侧为模糊的原图，悬停时分割线左移，露出更多放大后的清晰画面 */}
      <div className="absolute inset-0 overflow-hidden transition-[clip-path] duration-700 [clip-path:inset(0_50%_0_0)] group-hover:[clip-path:inset(0_86%_0_0)]">
        <div className="h-full w-full scale-110 blur-[3px]">
          <Scenery palette="forest" />
        </div>
      </div>
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/90 shadow-[0_0_0_1px_rgb(0_0_0/0.08)] transition-[left] duration-700 group-hover:left-[14%]" />
      <span className="absolute right-2 top-2 rounded bg-white px-1.5 py-px font-mono text-[9px] font-bold tracking-wider text-neutral-900">
        4×
      </span>
    </div>
  )
}

function LongVisual() {
  const captions = useMessages().home.longCaptions
  const strips = (['ocean', 'dusk', 'sand'] as const).map((p, i) => ({ p, t: captions[i] }))
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
  const sample = useMessages().social.sample
  return (
    <div className="relative h-[150px] w-[112px] overflow-hidden rounded-lg shadow-stage transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-105">
      <Scenery palette="dusk" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
      <span className="absolute left-2 top-2 rounded-full bg-white/90 px-1.5 py-px text-[7px] font-semibold text-neutral-900">
        {sample.tag}
      </span>
      <div className="absolute bottom-2.5 left-2 whitespace-pre-line text-[13px] font-bold leading-tight text-white">{sample.title}</div>
    </div>
  )
}

function GifVisual() {
  const frames = ['dusk', 'ocean', 'forest', 'sand'] as const
  const holes = (
    <div className="flex justify-between px-1.5">
      {Array.from({ length: 11 }, (_, i) => (
        <span key={i} className="h-1.5 w-2.5 rounded-[2px] bg-white/25" />
      ))}
    </div>
  )
  return (
    <div className="relative w-[228px] space-y-2 overflow-hidden rounded-lg bg-neutral-900 py-2 shadow-stage transition-transform duration-500 group-hover:scale-105">
      {holes}
      <div className="flex gap-2 px-2 transition-transform duration-700 ease-out group-hover:-translate-x-[152px]">
        {[...frames, ...frames].map((p, i) => (
          <div key={i} className="h-[56px] w-[68px] shrink-0 overflow-hidden rounded-[3px]">
            <Scenery palette={p} />
          </div>
        ))}
      </div>
      {holes}
      <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-white px-1.5 py-px font-mono text-[9px] font-bold tracking-wider text-neutral-900">
        GIF
      </span>
    </div>
  )
}

function VideoGifVisual() {
  const strip = ['dusk', 'dusk', 'ocean', 'ocean', 'forest', 'forest', 'sand', 'sand'] as const
  return (
    <div className="w-[216px] transition-transform duration-500 group-hover:scale-105">
      <div className="relative aspect-video overflow-hidden rounded-lg shadow-stage">
        <Scenery palette="ocean" />
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-black/35 backdrop-blur-sm">
            <Play className="ml-0.5 h-4 w-4 fill-white text-white" />
          </span>
        </span>
        <span className="absolute right-2 top-2 rounded bg-white px-1.5 py-px font-mono text-[9px] font-bold tracking-wider text-neutral-900">
          GIF
        </span>
      </div>
      {/* 时间轴：选框在悬停时滑向另一段 */}
      <div className="relative mt-2.5 flex h-7 gap-px overflow-hidden rounded-md shadow-stage">
        {strip.map((p, i) => (
          <div key={i} className="flex-1 opacity-50">
            <Scenery palette={p} sun={false} />
          </div>
        ))}
        <span className="absolute inset-y-0 left-[18%] right-[46%] rounded-[4px] border-2 border-brand bg-white/10 transition-[left,right] duration-700 ease-out group-hover:left-[44%] group-hover:right-[20%]" />
      </div>
    </div>
  )
}

function ExifVisual() {
  const rows = [
    ['GPS', '31.2304°N 121.4737°E'],
    ['Device', 'iPhone 15 Pro'],
    ['Date', '2025:06:01 09:41'],
  ]
  return (
    <div className="flex w-[78%] max-w-[280px] items-center gap-3 rounded-xl border border-line bg-panel p-2.5 shadow-[var(--highlight),0_1px_2px_rgb(0_0_0/0.05)]">
      <span className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg">
        <Scenery palette="forest" />
      </span>
      <div className="min-w-0 flex-1 space-y-1.5 font-mono text-[10px]">
        {rows.map(([k, v], i) => (
          <div
            key={k}
            className="flex gap-2 whitespace-nowrap transition-opacity duration-500 group-hover:opacity-35"
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <span className={cn('w-9 shrink-0', i === 0 ? 'text-danger' : 'text-muted')}>{k}</span>
            <span className="relative truncate text-fg">
              {v}
              <span
                className="absolute inset-x-0 top-1/2 h-px origin-left scale-x-0 bg-fg transition-transform duration-500 group-hover:scale-x-100"
                style={{ transitionDelay: `${i * 80}ms` }}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnnotateVisual() {
  return (
    <div className="relative h-[124px] w-[176px] overflow-hidden rounded-lg shadow-stage transition-transform duration-500 group-hover:-rotate-2 group-hover:scale-105">
      <Scenery palette="ocean" />
      {/* 马赛克 */}
      <div className="absolute bottom-3 left-3 grid h-6 w-12 grid-cols-4 grid-rows-2 overflow-hidden rounded-[2px]">
        {['#075985', '#0F172A', '#0C4A6E', '#075985', '#0F172A', '#075985', '#0F172A', '#0C4A6E'].map((c, i) => (
          <span key={i} style={{ background: c }} />
        ))}
      </div>
      <svg viewBox="0 0 176 124" className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
        <rect x="98" y="30" width="46" height="46" rx="3" stroke="#FF3B30" strokeWidth="3" />
        <g className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1">
          <path d="M40 92 L86 59.5" stroke="#FF3B30" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M95 53 L88.7 64.8 L81.7 55 Z" fill="#FF3B30" stroke="#FF3B30" strokeWidth="2" strokeLinejoin="round" />
        </g>
        <circle cx="152" cy="24" r="10" fill="#FF3B30" stroke="#fff" strokeWidth="2" />
        <text x="152" y="28.5" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">
          1
        </text>
      </svg>
    </div>
  )
}

/** 示意二维码：21×21 码点，按固定规则撒点（非真实编码），避开三个定位点与中心 Logo */
const qrDots = Array.from({ length: 21 * 21 }, (_, i) => [i % 21, Math.floor(i / 21)]).filter(([x, y]) => {
  const finder = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)
  const logo = x > 7 && x < 13 && y > 7 && y < 13
  return !finder && !logo && (x * 37 + y * 11 + x * y * 7) % 7 < 3
})

function QrVisual() {
  return (
    <div className="rounded-xl bg-white p-3 shadow-stage transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-105">
      <svg viewBox="0 0 21 21" className="h-[118px] w-[118px]" aria-hidden>
        {qrDots.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x + 0.06} y={y + 0.06} width={0.88} height={0.88} rx={0.44} fill="#111114" />
        ))}
        {[
          [0, 0],
          [14, 0],
          [0, 14],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <rect x={x + 0.5} y={y + 0.5} width={6} height={6} rx={1.8} fill="none" stroke="#111114" strokeWidth={1} />
            <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.9} fill="#111114" />
          </g>
        ))}
        <rect
          x={8.6}
          y={8.6}
          width={3.8}
          height={3.8}
          rx={1}
          style={{ fill: 'rgb(var(--brand))' }}
          className="origin-center transition-transform duration-500 [transform-box:fill-box] group-hover:rotate-90"
        />
      </svg>
    </div>
  )
}

/* ───────────────────────── Privacy ───────────────────────── */

function Privacy() {
  const m = useMessages().home
  return (
    <section className="border-t border-line bg-panel/40">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 lg:grid-cols-2">
        <div>
          <div className="eyebrow">Privacy by design</div>
          <h2 className="text-metal mt-3 text-[32px] font-semibold leading-tight tracking-[-0.035em] sm:text-[40px]">
            {m.privacyTitle1}
            <br />
            {m.privacyTitle2}
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">{m.privacyDesc}</p>
          <ul className="mt-8 space-y-3">
            {m.privacyPoints.map((p) => (
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
            <LogLine k="decode" v="128 images" r="0.6s" />
            <LogLine k="resize · encode" v="Web Worker × 8" r="1.8s" />
            <LogLine k="ai.segment" v="WebGPU" r="0.4s" />
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
