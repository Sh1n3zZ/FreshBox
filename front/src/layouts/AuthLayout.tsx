import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'
import { useEffect } from 'react'

const AuthLayout = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // 如果已经登录，重定向到首页
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-6 flex items-center">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/vite.svg" alt="FreshBox" className="h-8 w-8" />
          <span className="text-2xl font-bold">FreshBox</span>
        </Link>
      </div>
      
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <Outlet />
      </div>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} FreshBox. 保留所有权利。</p>
      </div>
    </div>
  )
}

export default AuthLayout 