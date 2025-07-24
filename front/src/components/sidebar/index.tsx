import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth-provider'
import { useTranslation } from 'react-i18next'
import { GlobalAvatar } from '@/components/GlobalAvatar'
import { 
  Home, 
  User, 
  Settings,
  Scan,
  BarChart,
  X,
  Shield,
  Trophy,
  ShoppingCart,
  List
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface SidebarItemProps {
  href: string
  icon: React.ReactNode
  title: string
  isActive?: boolean
}

function SidebarItem({ href, icon, title, isActive }: SidebarItemProps) {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {icon}
      <span>{title}</span>
    </Link>
  )
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { pathname } = useLocation()
  const { user, isAdmin } = useAuth()
  const { t } = useTranslation()
  
  return (
    <>
      {/* 移动端遮罩层 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* 侧边栏 */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-300 md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/FreshBoxLogo.svg" alt="FreshBox" className="h-6 w-6" />
            <span className="text-xl font-bold">FreshBox</span>
          </Link>
          
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">关闭</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid gap-1 px-2">
            <SidebarItem
              href="/"
              icon={<Home className="h-4 w-4" />}
              title={t('home')}
              isActive={pathname === '/'}
            />
            
            <SidebarItem
              href="/ocr"
              icon={<Scan className="h-4 w-4" />}
              title={t('ocr-recognition')}
              isActive={pathname.startsWith('/ocr')}
            />

            <SidebarItem
              href="/task/explore"
              icon={<Trophy className="h-4 w-4" />}
              title={t('challenge')}
              isActive={pathname.startsWith('/task/explore')}
            />
            
            {isAdmin && (
              <>
                <div className="my-2 px-3 text-xs font-medium text-muted-foreground">
                  {t('dashboard.admin-panel')}
                </div>
                
                <SidebarItem
                  href="/dashboard"  // 修改这里，使用直接路径
                  icon={<BarChart className="h-4 w-4" />}
                  title={t('dashboard.title')}
                  isActive={pathname === '/dashboard'}
                />
                
                <SidebarItem
                  href="/admin/settings"
                  icon={<Settings className="h-4 w-4" />}
                  title={t('dashboard.quickActions.system.title')}
                  isActive={pathname.startsWith('/admin/settings')}
                />
                
                <SidebarItem
                  href="/admin/users"
                  icon={<Shield className="h-4 w-4" />}
                  title={t('dashboard.quickActions.users.title')}
                  isActive={pathname.startsWith('/admin/users')}
                />

                <SidebarItem
                  href="/admin/orders"
                  icon={<ShoppingCart className="h-4 w-4" />}
                  title={t('dashboard.quickActions.orders.title')}
                  isActive={pathname.startsWith('/admin/orders')}
                />

                <SidebarItem
                  href="/admin/tasks"
                  icon={<List className="h-4 w-4" />}
                  title={t('dashboard.quickActions.tasks.title')}
                  isActive={pathname.startsWith('/admin/tasks')}
                />
              </>
            )}
          </nav>
        </div>
        
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <GlobalAvatar user={user || {}} size="sm" />
            <div>
              <div className="text-sm font-medium">{user?.username}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
