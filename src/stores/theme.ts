import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'system'

const KEY = 'tubox-theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

function read(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

function apply(mode: ThemeMode) {
  const dark = mode === 'dark' || (mode === 'system' && media().matches)
  document.documentElement.classList.toggle('dark', dark)
  return dark
}

interface ThemeState {
  mode: ThemeMode
  dark: boolean
  setMode: (m: ThemeMode) => void
}

export const useTheme = create<ThemeState>((set, get) => {
  const mode = read()
  media().addEventListener('change', () => {
    if (get().mode === 'system') set({ dark: apply('system') })
  })
  return {
    mode,
    dark: apply(mode),
    setMode: (m) => {
      try {
        localStorage.setItem(KEY, m)
      } catch {
        /* 隐私模式等场景忽略 */
      }
      set({ mode: m, dark: apply(m) })
    },
  }
})
