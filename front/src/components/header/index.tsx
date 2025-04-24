import { Link } from 'react-router-dom'
import { Menu, User, LogOut, Moon, Sun } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { useTheme } from '@/providers/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslation } from 'react-i18next'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuth()
  const { t } = useTranslation()
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2 md:gap-6">
          <button
            onClick={onMenuClick}
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">{t('Open menu')}</span>
          </button>
          
          <Link to="/" className="flex items-center space-x-2">
            <img src="/vite.svg" alt="FreshBox" className="h-6 w-6" />
            <span className="hidden text-xl font-bold sm:inline-block">
              FreshBox
            </span>
          </Link>
          
          <nav className="hidden gap-6 md:flex">
            <Link
              to="/"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t('Home')}
            </Link>
            <Link
              to="/ocr"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t('OCR Recognition')}
            </Link>
            <Link
              to="/about"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t('About Us')}
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:block">
                <div className="text-sm font-medium">{user?.name}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </div>
              
              <div className="relative">
                <button
                  className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              <button 
                onClick={logout} 
                className="flex items-center gap-1 rounded-md p-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline-block">{t('Logout')}</span>
              </button>
            </div>
          ) : (
            <Link
              to="/auth/login"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t('Login / Register')}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
} 