import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'
import { 
  FileText,
  MoreHorizontal,
  ArrowUpRight,
  Plus,
  RefreshCw
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BlindBoxOpeningTrendChart } from "@/components/BlindBoxOpeningTrendChart"
import { DashboardStatsData } from "@/components/DashboardStatsData"
import { formatCurrency } from '@/lib/utils'
import { dashboardService, DashboardStats } from '@/lib/dashboard'

interface ActivityItem {
  id: number;
  user: string;
  avatar: string;
  action: 'purchased' | 'opened' | 'donated';
  time: number;
  timeUnit: 'minutesAgo' | 'hoursAgo' | 'daysAgo';
  boxCount?: number;
  donationAmount?: number;
}

// 更新示例数据为盲盒相关的活动
const recentActivity: ActivityItem[] = [
  { id: 1, user: '张三', avatar: 'Z', action: 'purchased', time: 10, timeUnit: 'minutesAgo', boxCount: 2 },
  { id: 2, user: '李四', avatar: 'L', action: 'opened', time: 30, timeUnit: 'minutesAgo', boxCount: 1 },
  { id: 3, user: '王五', avatar: 'W', action: 'donated', time: 1, timeUnit: 'hoursAgo', donationAmount: 100 },
  { id: 4, user: '赵六', avatar: 'Z', action: 'purchased', time: 2, timeUnit: 'hoursAgo', boxCount: 1 },
  { id: 5, user: '钱七', avatar: 'Q', action: 'opened', time: 3, timeUnit: 'hoursAgo', boxCount: 3 }
];

export default function Dashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const data = await dashboardService.getDashboardStats()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="container mx-auto max-w-7xl py-6 space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('dashboard.welcome', { name: user?.username || t('admin') })}
        </p>
      </div>

      {/* 主要内容区域 */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">{t('dashboard.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('dashboard.tabs.analytics')}</TabsTrigger>
            <TabsTrigger value="reports">{t('dashboard.tabs.reports')}</TabsTrigger>
            <TabsTrigger value="settings">{t('dashboard.tabs.settings')}</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1"
              onClick={fetchStats}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline-block">{t('dashboard.actions.refresh')}</span>
            </Button>
            <Button size="sm" className="h-8 gap-1">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline-block">{t('dashboard.actions.new')}</span>
            </Button>
          </div>
        </div>
        
        <TabsContent value="overview" className="space-y-6">
          {/* 统计卡片 */}
          <DashboardStatsData stats={stats} />

          <div className="grid gap-4 md:grid-cols-7">
            {/* 图表部分 */}
            <Card className="md:col-span-4">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle>{t('dashboard.charts.title')}</CardTitle>
                  <CardDescription>{t('dashboard.charts.description')}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <BlindBoxOpeningTrendChart />
              </CardContent>
            </Card>

            {/* 最近活动 */}
            <Card className="md:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle>{t('dashboard.activity.title')}</CardTitle>
                  <CardDescription>{t('dashboard.activity.description')}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>{t('dashboard.actions.refresh')}</DropdownMenuItem>
                    <DropdownMenuItem>{t('dashboard.actions.viewAll')}</DropdownMenuItem>
                    <DropdownMenuItem>{t('Export Data')}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <Avatar>
                      <AvatarImage src={`/avatars/${activity.id}.png`} alt={activity.user} />
                      <AvatarFallback>{activity.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        <span className="font-semibold">{activity.user}</span>{' '}
                        {t(`dashboard.activity.actions.${activity.action}`)}
                        {activity.boxCount && (
                          <Badge variant="secondary" className="ml-2 py-0">
                            {t('dashboard.activity.boxCount', { count: activity.boxCount })}
                          </Badge>
                        )}
                        {activity.donationAmount && (
                          <Badge variant="secondary" className="ml-2 py-0">
                            {formatCurrency(activity.donationAmount)}
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(`dashboard.activity.time.${activity.timeUnit}`, { count: activity.time })}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full gap-1" asChild>
                  <Link to="/activity">
                    {t('dashboard.actions.viewAll')}
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* 快捷操作 */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.quickActions.ocr.title')}</CardTitle>
                <CardDescription>
                  {t('dashboard.quickActions.ocr.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.quickActions.ocr.content')}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild>
                  <Link to="/settings/ocr" className="w-full justify-between">
                    {t('dashboard.quickActions.ocr.action')}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.quickActions.users.title')}</CardTitle>
                <CardDescription>
                  {t('dashboard.quickActions.users.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.quickActions.users.content')}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild>
                  <Link to="/settings/users" className="w-full justify-between">
                    {t('dashboard.quickActions.users.action')}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.quickActions.system.title')}</CardTitle>
                <CardDescription>
                  {t('dashboard.quickActions.system.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.quickActions.system.content')}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild>
                  <Link to="/settings/system" className="w-full justify-between">
                    {t('dashboard.quickActions.system.action')}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">
              {t('dashboard.inDevelopment.title', { module: t('dashboard.tabs.analytics') })}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('dashboard.inDevelopment.description')}
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="reports" className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">
              {t('dashboard.inDevelopment.title', { module: t('dashboard.tabs.reports') })}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('dashboard.inDevelopment.description')}
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">
              {t('dashboard.inDevelopment.title', { module: t('dashboard.tabs.settings') })}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('dashboard.inDevelopment.description')}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}