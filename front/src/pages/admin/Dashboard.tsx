import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'
import { 
  FileText,
  ArrowUpRight,
  Plus,
  RefreshCw
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { BlindBoxOpeningTrendChart } from "@/components/BlindBoxOpeningTrendChart"
import { DashboardStatsData } from "@/components/DashboardStatsData"
import { UserRecentActivity } from "@/components/UserRecentActivity"
import { dashboardService, DashboardStats } from '@/lib/dashboard'

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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* 图表部分 */}
            <Card className="md:col-span-2 lg:col-span-4">
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
            <div className="md:col-span-2 lg:col-span-3">
              <UserRecentActivity />
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                <Button variant="outline" asChild className="w-full">
                  <Link to="/settings/ocr" className="flex items-center justify-between">
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
                <Button variant="outline" asChild className="w-full">
                  <Link to="/settings/users" className="flex items-center justify-between">
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
                <Button variant="outline" asChild className="w-full">
                  <Link to="/settings/system" className="flex items-center justify-between">
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