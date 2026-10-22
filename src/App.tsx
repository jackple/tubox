import { lazy } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { useTheme } from '@/stores/theme'

// 按页面拆包：MediaPipe 等重依赖只在进入证件照时加载
const HomePage = lazy(() => import('@/features/home/HomePage'))
const BatchPage = lazy(() => import('@/features/batch/BatchPage'))
const IdPhotoPage = lazy(() => import('@/features/idphoto/IdPhotoPage'))
const LongImagePage = lazy(() => import('@/features/collage/LongImagePage'))
const GridPage = lazy(() => import('@/features/collage/GridPage'))
const NineGridPage = lazy(() => import('@/features/collage/NineGridPage'))
const SocialPage = lazy(() => import('@/features/collage/SocialPage'))

// History 路由：URL 干净（/batch、/collage/grid）。部署时需让服务器把未知路径回退到 index.html，见 README
const router = createBrowserRouter(
  [
    {
      element: <AppShell />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'batch', element: <BatchPage /> },
        { path: 'id-photo', element: <IdPhotoPage /> },
        { path: 'collage/long', element: <LongImagePage /> },
        { path: 'collage/grid', element: <GridPage /> },
        { path: 'collage/nine', element: <NineGridPage /> },
        { path: 'collage/social', element: <SocialPage /> },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  {
    // 支持部署在子路径：vite build --base=/tubox/
    basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/',
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
)

export function App() {
  const dark = useTheme((s) => s.dark)
  return (
    <>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
      <Toaster position="top-center" theme={dark ? 'dark' : 'light'} richColors closeButton toastOptions={{ className: 'font-sans' }} />
    </>
  )
}
