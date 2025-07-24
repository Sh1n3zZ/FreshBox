import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  User, 
  loginUser, 
  registerUser,
  sendVerificationCode,
  getUserFromLocalStorage, 
  saveUserToLocalStorage, 
  removeUserFromLocalStorage,
  refreshToken,
  fetchUserProfile
} from '@/lib/auth'

// 用户角色类型
export type UserRole = 'admin' | 'user'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isAdmin: boolean
  login: (login: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, code: string) => Promise<void>
  sendCode: (email: string) => Promise<void>
  logout: () => void
  updateUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const isAdmin = user?.role === 'admin'

  const validateToken = async (userData: User): Promise<boolean> => {
    try {
      if (!userData.access_token || !userData.access_token.includes('.')) {
        console.error('Token格式不正确')
        return false
      }
      
      try {
        const parts = userData.access_token.split('.')
        if (parts.length !== 3) {
          console.error('JWT token格式不正确')
          return false
        }
        
        const payload = parts[1]
        const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
        const tokenExp = decodedPayload.exp
        const now = Math.floor(Date.now() / 1000)
        
        if (tokenExp <= now) {
          console.log('Token已过期，尝试刷新')
          try {
            const newUserData = await refreshToken(userData.refresh_token)
            if (!newUserData.role) {
              newUserData.role = 'user'
            }
            saveUserToLocalStorage(newUserData)
            setUser(newUserData)
            return true
          } catch (refreshError) {
            console.error('刷新token失败:', refreshError)
            return false
          }
        }
        
        if (tokenExp - now < 300) {
          console.log('Token即将过期，尝试刷新')
          try {
            const newUserData = await refreshToken(userData.refresh_token)
            if (!newUserData.role) {
              newUserData.role = 'user'
            }
            saveUserToLocalStorage(newUserData)
            setUser(newUserData)
            return true
          } catch (refreshError) {
            console.error('刷新token失败，但原token仍有效:', refreshError)
            return true
          }
        }
        
        return true
      } catch (parseError) {
        console.error('解析token失败:', parseError)
        return true
      }
    } catch (error) {
      console.error('验证token过程发生错误:', error)
      return false
    }
  }

  useEffect(() => {
    const loadUser = async () => {
      const userObj = await getUserFromLocalStorage()
      
      if (userObj) {
        const isValid = await validateToken(userObj)
        if (isValid) {
          setUser(userObj)
        } else {
          removeUserFromLocalStorage()
          setUser(null)
          if (!location.pathname.startsWith('/auth')) {
            navigate('/auth/login', { 
              state: { from: location },
              replace: true 
            })
          }
        }
      }
      
      setIsLoading(false)
    }

    loadUser()
  }, [location, navigate])

  useEffect(() => {
    if (!user) return

    const checkToken = async () => {
      const isValid = await validateToken(user)
      if (!isValid) {
        removeUserFromLocalStorage()
        setUser(null)
        toast.error('登录已过期，请重新登录')
        navigate('/auth/login', { 
          state: { from: location },
          replace: true 
        })
      }
    }

    const interval = setInterval(checkToken, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user, location, navigate])

  const login = async (login: string, password: string) => {
    setIsLoading(true)
    
    try {
      const userData = await loginUser(login, password)
      
      if (!userData || !userData.access_token || !userData.refresh_token) {
        throw new Error('登录响应异常，请联系管理员')
      }

      saveUserToLocalStorage(userData)
      setUser(userData)
      toast.success('登录成功')

      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (error) {
      console.error('登录过程发生错误:', error)
      const errorMessage = error instanceof Error ? error.message : '登录失败，请稍后重试'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const sendCode = async (email: string) => {
    try {
      await sendVerificationCode(email)
      toast.success('验证码已发送到您的邮箱，请注意查收')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发送验证码失败，请稍后重试'
      toast.error(errorMessage)
      throw error
    }
  }

  const register = async (username: string, email: string, password: string, code: string) => {
    setIsLoading(true)
    
    try {
      const userData = await registerUser(username, email, password, code)
      
      saveUserToLocalStorage(userData)
      setUser(userData)
      toast.success('注册成功，欢迎加入！')
      navigate('/')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '注册失败，请稍后重试'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    removeUserFromLocalStorage()
    setUser(null)
    toast.info('已退出登录')
    navigate('/auth/login')
  }

  const updateUser = async () => {
    const savedToken = localStorage.getItem('access_token');
    if (savedToken) {
      try {
        const freshUserData = await fetchUserProfile(savedToken);
        setUser({ ...freshUserData, access_token: savedToken, refresh_token: localStorage.getItem('refresh_token') || '' });
      } catch (error) {
        console.error('实时获取用户信息失败:', error);
      }
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isAdmin,
    login,
    register,
    sendCode,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

export type { User }
