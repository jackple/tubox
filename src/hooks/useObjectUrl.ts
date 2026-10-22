import { useEffect, useState } from 'react'

/** 为 Blob 创建 objectURL 并在变更 / 卸载时自动回收 */
export function useObjectUrl(blob: Blob | null | undefined) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!blob) return setUrl(null)
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}
