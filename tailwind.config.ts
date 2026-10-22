import type { Config } from 'tailwindcss'

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        panel: token('panel'),
        subtle: token('subtle'),
        line: token('line'),
        fg: token('fg'),
        muted: token('muted'),
        brand: { DEFAULT: token('brand'), soft: token('brand-soft') },
        accent: token('accent'),
        success: token('success'),
        warning: token('warning'),
        danger: token('danger'),
      },
      fontFamily: {
        sans: ['"Geist Variable"', '"PingFang SC"', '"HarmonyOS Sans SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: { '4xl': '2rem' },
      boxShadow: {
        xs: '0 1px 2px rgb(0 0 0 / 0.05)',
        soft: 'var(--shadow-soft)',
        lift: 'var(--shadow-lift)',
        stage: 'var(--shadow-stage)',
        glow: '0 0 0 1px rgb(var(--brand) / 0.35), 0 8px 24px -8px rgb(var(--brand) / 0.5)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        aurora: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(4%,-6%) scale(1.08)' },
          '66%': { transform: 'translate(-5%,4%) scale(0.95)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        beam: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(220%)' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        shimmer: 'shimmer 1.4s infinite',
        beam: 'beam 3.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
