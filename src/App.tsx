import { lazy, Suspense, useEffect, useState } from 'react'
import { createBrowserRouter, Navigate, type RouteObject, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useLocalizedPath } from '@/i18n'
import { locales } from '@/i18n/locales'

// 按页面拆包：MediaPipe / onnxruntime 等重依赖只在进入抠图 / 证件照 / 高清放大时加载
const HomePage = lazy(() => import('@/features/home/HomePage'))
const BatchPage = lazy(() => import('@/features/batch/BatchPage'))
const CutoutPage = lazy(() => import('@/features/cutout/CutoutPage'))
const UpscalePage = lazy(() => import('@/features/upscale/UpscalePage'))
const AnnotatePage = lazy(() => import('@/features/annotate/AnnotatePage'))
const ExifPage = lazy(() => import('@/features/exif/ExifPage'))
const IdPhotoPage = lazy(() => import('@/features/idphoto/IdPhotoPage'))
const LongImagePage = lazy(() => import('@/features/collage/LongImagePage'))
const GridPage = lazy(() => import('@/features/collage/GridPage'))
const NineGridPage = lazy(() => import('@/features/collage/NineGridPage'))
const SocialPage = lazy(() => import('@/features/collage/SocialPage'))
const GifPage = lazy(() => import('@/features/gif/GifPage'))
const VideoGifPage = lazy(() => import('@/features/gif/VideoGifPage'))
const QrCodePage = lazy(() => import('@/features/qrcode/QrCodePage'))
// 首次交互后再加载提示宿主；页面在交互前不会触发全局 toast
const ToastHost = lazy(() => import('@/components/common/ToastHost'))

function pageRoutes(): RouteObject[] {
  return [
    { index: true, element: <HomePage /> },
    { path: 'batch', element: <BatchPage /> },
    { path: 'cutout', element: <CutoutPage /> },
    { path: 'upscale', element: <UpscalePage /> },
    { path: 'annotate', element: <AnnotatePage /> },
    { path: 'exif', element: <ExifPage /> },
    { path: 'id-photo', element: <IdPhotoPage /> },
    { path: 'collage/long', element: <LongImagePage /> },
    { path: 'collage/grid', element: <GridPage /> },
    { path: 'collage/nine', element: <NineGridPage /> },
    { path: 'collage/social', element: <SocialPage /> },
    { path: 'gif', element: <GifPage /> },
    { path: 'video-to-gif', element: <VideoGifPage /> },
    { path: 'qr-code', element: <QrCodePage /> },
    { path: '*', element: <ToLocaleHome /> },
  ]
}

/** 未知路径回到当前语言的首页 */
function ToLocaleHome() {
  const to = useLocalizedPath()
  return <Navigate to={to('/')} replace />
}

// History 路由：URL 干净（/batch、/collage/grid）。部署时需让服务器把未知路径回退到 index.html，见 README
// 默认语言不带前缀，其余语言挂在 /en、/ja… 下，页面相同
// 路由在首次渲染时创建：main.tsx 会先按语言偏好改写 URL
let router: ReturnType<typeof createBrowserRouter> | undefined
const getRouter = () =>
  (router ??= createBrowserRouter(
    [
      {
        element: <AppShell />,
        children: [...pageRoutes(), ...locales.filter((l) => l.prefix).map((l) => ({ path: l.prefix, children: pageRoutes() }))],
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
  ))

export function App() {
  const [toastReady, setToastReady] = useState(false)
  useEffect(() => {
    const events = ['pointerdown', 'keydown', 'click'] as const
    const activate = () => setToastReady(true)
    for (const event of events) document.addEventListener(event, activate, { capture: true, once: true })
    return () => {
      for (const event of events) document.removeEventListener(event, activate, { capture: true })
    }
  }, [])

  return (
    <>
      <RouterProvider router={getRouter()} future={{ v7_startTransition: true }} />
      <Suspense fallback={null}>{toastReady && <ToastHost />}</Suspense>
    </>
  )
}
