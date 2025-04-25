import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { sendVerificationCode } from '@/lib/auth'

export default function Register() {
  const { register, isLoading } = useAuth()
  
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    code: '',
    general: ''
  })

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSendCode = async () => {
    if (!email) {
      setErrors(prev => ({ ...prev, email: '请输入邮箱地址' }))
      return
    }
    if (!validateEmail(email)) {
      setErrors(prev => ({ ...prev, email: '请输入有效的邮箱地址' }))
      return
    }

    try {
      await sendVerificationCode(email)
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      setErrors(prev => ({ ...prev, general: error.message || '发送验证码失败' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 重置错误
    setErrors({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      code: '',
      general: ''
    })

    // 表单验证
    let hasError = false
    const newErrors = { ...errors }

    if (!username.trim()) {
      newErrors.username = '请输入用户名'
      hasError = true
    }

    if (!email.trim()) {
      newErrors.email = '请输入邮箱'
      hasError = true
    } else if (!validateEmail(email)) {
      newErrors.email = '请输入有效的邮箱地址'
      hasError = true
    }

    if (!password) {
      newErrors.password = '请输入密码'
      hasError = true
    } else if (password.length < 6) {
      newErrors.password = '密码长度至少为6个字符'
      hasError = true
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = '请确认密码'
      hasError = true
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
      hasError = true
    }

    if (!code) {
      newErrors.code = '请输入验证码'
      hasError = true
    }

    if (hasError) {
      setErrors(newErrors)
      return
    }

    try {
      await register(username, email, password, code)
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message
        if (errorMessage.includes('用户名')) {
          setErrors(prev => ({ ...prev, username: errorMessage }))
        } else if (errorMessage.includes('邮箱')) {
          setErrors(prev => ({ ...prev, email: errorMessage }))
        } else if (errorMessage.includes('验证码')) {
          setErrors(prev => ({ ...prev, code: errorMessage }))
        } else {
          setErrors(prev => ({ ...prev, general: errorMessage }))
        }
      }
    }
  }

  return (
    <div className="container flex h-screen max-w-md flex-col items-center justify-center">
      <div className="w-full space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">注册账户</h1>
          <p className="text-muted-foreground">
            注册账户以使用更多高级功能
          </p>
        </div>

        {errors.general && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full rounded-md border ${
                errors.username ? 'border-destructive' : 'border-input'
              } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring`}
              placeholder="请输入用户名"
            />
            {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-md border ${
                errors.email ? 'border-destructive' : 'border-input'
              } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring`}
              placeholder="example@example.com"
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              验证码
            </label>
            <div className="flex gap-2">
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`flex-1 rounded-md border ${
                  errors.code ? 'border-destructive' : 'border-input'
                } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring`}
                placeholder="请输入验证码"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
              </button>
            </div>
            {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              密码
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-md border ${
                  errors.password ? 'border-destructive' : 'border-input'
                } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring`}
                placeholder="请输入密码"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              确认密码
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full rounded-md border ${
                  errors.confirmPassword ? 'border-destructive' : 'border-input'
                } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring`}
                placeholder="请再次输入密码"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="text-center text-sm">
          已有账户？{' '}
          <Link to="/auth/login" className="font-medium text-primary hover:underline">
            登录
          </Link>
        </div>
      </div>
    </div>
  )
} 