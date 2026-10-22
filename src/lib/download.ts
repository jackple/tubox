export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

function uniqueName(name: string, used: Set<string>) {
  if (!used.has(name)) return (used.add(name), name)
  const dot = name.lastIndexOf('.')
  const stem = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  for (let i = 2; ; i++) {
    const n = `${stem} (${i})${ext}`
    if (!used.has(n)) return (used.add(n), n)
  }
}

/** 打包下载；单文件直接下载。JSZip 按需加载 */
export async function saveFiles(files: { name: string; blob: Blob }[], zipName: string) {
  if (!files.length) return
  if (files.length === 1) return saveBlob(files[0].blob, files[0].name)
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const used = new Set<string>()
  for (const f of files) zip.file(uniqueName(f.name, used), f.blob)
  // 图片本身已压缩，STORE 模式最快
  const out = await zip.generateAsync({ type: 'blob', compression: 'STORE' })
  saveBlob(out, zipName)
}

export const timestamp = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}
