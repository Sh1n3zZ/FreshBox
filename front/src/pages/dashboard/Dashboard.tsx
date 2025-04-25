import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'
import { toast } from 'sonner'
import { 
  BarChart3, 
  Users, 
  FileText, 
  Clock, 
  MoreHorizontal,
  ArrowUpRight,
  ChevronUp,
  ChevronDown,
  Plus,
  RefreshCw
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// 示例数据
const statsData = [
  { 
    key: 'totalUsers',
    value: '1,284', 
    change: '+12.5%', 
    isPositive: true,
    icon: <Users className="h-4 w-4" />
  },
  { 
    key: 'recognitionCount',
    value: '12,543', 
    change: '+24.3%', 
    isPositive: true,
    icon: <FileText className="h-4 w-4" />
  },
  { 
    key: 'todayRecognition',
    value: '487', 
    change: '-3.2%', 
    isPositive: false,
    icon: <Clock className="h-4 w-4" />
  },
  { 
    key: 'accuracy',
    value: '96.8%', 
    change: '+1.2%', 
    isPositive: true,
    icon: <BarChart3 className="h-4 w-4" />
  }
]

const recentActivity = [
  { id: 1, user: '张三', avatar: 'Z', action: 'recognized', time: 10, timeUnit: 'minutesAgo', imageCount: 1 },
  { id: 2, user: '李四', avatar: 'L', action: 'batchProcessed', time: 30, timeUnit: 'minutesAgo', imageCount: 12 },
  { id: 3, user: '王五', avatar: 'W', action: 'registered', time: 1, timeUnit: 'hoursAgo', imageCount: 0 },
  { id: 4, user: '赵六', avatar: 'Z', action: 'recognized', time: 2, timeUnit: 'hoursAgo', imageCount: 1 },
  { id: 5, user: '钱七', avatar: 'Q', action: 'batchProcessed', time: 3, timeUnit: 'hoursAgo', imageCount: 5 }
]

export default function Dashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedPeriod, setSelectedPeriod] = useState("monthly")
  const { t } = useTranslation()

  const refreshStats = () => {
    toast.info("正在刷新数据...");
    // 模拟刷新后的成功通知
    setTimeout(() => {
      toast.success("数据已更新");
    }, 1500);
  };

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
              onClick={refreshStats}
              className="h-8 gap-1"
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">
                    {t(`dashboard.stats.${stat.key}`)}
                  </CardTitle>
                  <div className="rounded-md bg-primary/10 p-1">
                    {stat.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <Badge 
                    variant={stat.isPositive ? "outline" : "destructive"} 
                    className={`mt-1 font-normal ${
                      stat.isPositive ? 'text-green-600 border-green-600/30 bg-green-100/50 dark:bg-green-900/20 dark:text-green-400' : ''
                    }`}
                  >
                    <span className="flex items-center">
                      {stat.change}
                      {stat.isPositive ? (
                        <ChevronUp className="ml-1 h-3 w-3" />
                      ) : (
                        <ChevronDown className="ml-1 h-3 w-3" />
                      )}
                    </span>
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-7">
            {/* 图表部分 */}
            <Card className="md:col-span-4">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle>{t('dashboard.charts.title')}</CardTitle>
                  <CardDescription>{t('dashboard.charts.description')}</CardDescription>
                </div>
                <div>
                  <Select
                    value={selectedPeriod}
                    onValueChange={setSelectedPeriod}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder={t('Select period')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">{t('dashboard.charts.periods.daily')}</SelectItem>
                      <SelectItem value="weekly">{t('dashboard.charts.periods.weekly')}</SelectItem>
                      <SelectItem value="monthly">{t('dashboard.charts.periods.monthly')}</SelectItem>
                      <SelectItem value="yearly">{t('dashboard.charts.periods.yearly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {/* 图表占位 */}
                <div className="h-[300px] w-full rounded-md bg-muted/30">
                  <div className="flex h-full flex-col items-center justify-center">
                    <BarChart3 className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{t('dashboard.charts.loading')}</p>
                  </div>
                </div>
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
                        <span className="font-semibold">{activity.user}</span> {t(`dashboard.activity.actions.${activity.action}`)}
                        {activity.imageCount > 1 && 
                          <Badge variant="secondary" className="ml-2 py-0">
                            {t('dashboard.activity.imageCount', { count: activity.imageCount })}
                          </Badge>
                        }
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