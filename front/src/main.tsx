import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

import '@/index.css'
import '@/i18n/i18n'
import { setupAxiosInterceptors } from '@/lib/api-setup'

import { Toaster } from 'sonner'

// 初始化 axios 拦截器
setupAxiosInterceptors();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  </React.StrictMode>,
)
