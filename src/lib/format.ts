export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

export const percentChange = (from: number, to: number) => (from ? Math.round(((to - from) / from) * 100) : 0)

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
