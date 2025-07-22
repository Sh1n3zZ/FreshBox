import { Link, useNavigate } from 'react-router-dom'
import { Menu, User, LogOut } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { useTheme } from '@/providers/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { theme } = useTheme()
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2 md:gap-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="h-10 w-10 p-0 md:hidden"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">{t('Open menu')}</span>
          </Button>
          <Link to="/about" className="flex items-center space-x-2">
            <img src="/FreshBoxLogo.svg" alt="FreshBox" className="h-10 w-10" />
            <span className="hidden text-xl font-bold sm:inline-block">
              FreshBox 临期食品盲盒社交化系统
            </span>
          </Link>
          
          <nav className="hidden gap-2 md:flex">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-9"
            >
              <Link to="/">
                {t('home')}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-9"
            >
              <Link to="/ocr">
                {t('ocr-recognition')}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-9"
            >
              <Link to="/about">
                {t('about-us')}
              </Link>
            </Button>
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <div className="text-sm font-medium">{user?.username}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </div>
              
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-full"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <Button 
                variant="ghost"
                size="sm"
                onClick={logout} 
                className="h-9 flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline-block">{t('Logout')}</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/auth/login')}
              className={`h-9 ${theme === 'light' ? 'text-black' : ''}`}
            >
              {t('login-and-register')}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
} 