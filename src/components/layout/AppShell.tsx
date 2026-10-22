import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useSeo } from '@/hooks/useSeo'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'

export function AppShell() {
  useSeo()
  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main className="relative min-h-0 flex-1">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

function PageLoader() {
  return (
    <div className="grid h-full place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-brand" />
    </div>
  )
}
