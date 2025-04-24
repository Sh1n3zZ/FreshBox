import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { 
  User, 
  loginUser, 
  registerUser, 
  getUserFromLocalStorage, 
  saveUserToLocalStorage, 
  removeUserFromLocalStorage 
} from '@/lib/auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const loadUser = async () => {
      const userObj = getUserFromLocalStorage()
      
      if (userObj) {
        // TODO: token validation can be added here, if the token is invalid, clear the login information
        setUser(userObj)
      }
      
      setIsLoading(false)
    }

    loadUser()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    
    try {
      const userData = await loginUser(email, password)
      
      saveUserToLocalStorage(userData)
      setUser(userData)
      toast.success('登录成功')
      navigate('/')
    } catch (error) {
      toast.error(`登录失败: ${error instanceof Error ? error.message : '未知错误'}`)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true)
    
    try {
      await registerUser(email, password, name)
      toast.success('注册成功，请登录')
      navigate('/auth/login')
    } catch (error) {
      toast.error(`注册失败: ${error instanceof Error ? error.message : '未知错误'}`)
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

  const updateUser = (updatedUserData: Partial<User>) => {
    if (!user) return

    const newUserData = { ...user, ...updatedUserData }
    saveUserToLocalStorage(newUserData)
    setUser(newUserData)
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
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
