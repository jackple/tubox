import { Toaster } from 'sonner'
import { useTheme } from '@/stores/theme'

export default function ToastHost() {
  const dark = useTheme((s) => s.dark)
  return <Toaster position="top-center" theme={dark ? 'dark' : 'light'} richColors closeButton toastOptions={{ className: 'font-sans' }} />
}
