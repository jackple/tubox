import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import './styles/index.css'
import { App } from './App'
import { initLocale } from './stores/locale'

// 先确定语言并加载语言包（可能改写 URL 到对应语言前缀），再创建路由并渲染
initLocale().then(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
)
