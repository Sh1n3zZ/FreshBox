import { Outlet, useLocation, Navigate } from 'react-router-dom'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Sidebar } from '@/components/sidebar'
import { useAuth } from '@/providers/auth-provider'
import { useState } from 'react'

const MainLayout = () => {
  const { isAuthenticated, isAdmin } = useAuth()
  const { pathname } = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // 检查是否是管理员路由
  const isAdminRoute = pathname.startsWith('/admin')

  // 如果是管理员路由但用户不是管理员，重定向到首页
  if (isAdminRoute && !isAdmin) {
    return <Navigate to="/" replace />
  }

  // 如果未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex flex-1">
        {isAuthenticated && (
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />
        )}
        
        <main className="flex-1 p-4 md:p-6 mx-auto w-full">
          <Outlet />
        </main>
      </div>
      
      <Footer />
    </div>
  )
}

export default MainLayout