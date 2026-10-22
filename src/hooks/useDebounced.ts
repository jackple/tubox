import { useEffect, useState } from 'react'

export function useDebounced<T>(value: T, delay = 200): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}
