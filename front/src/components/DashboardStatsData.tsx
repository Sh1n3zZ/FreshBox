import { 
  BarChart3, 
  Users, 
  Heart, 
  FileText
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from '@/lib/utils'
import { DashboardStats } from '@/lib/dashboard'

interface DashboardStatsDataProps {
  stats: DashboardStats | null;
}

export function DashboardStatsData({ stats }: DashboardStatsDataProps) {
  const { t } = useTranslation()

  if (!stats) {
    return null
  }

  const statsItems = [
    {
      key: 'dailyRevenue',
      value: formatCurrency(stats.dailyRevenue),
      change: `${stats.dailyRevenueChange.toFixed(1)}%`,
      isPositive: stats.dailyRevenueIsPositive,
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      key: 'totalBoxes',
      value: stats.totalBoxes.toString(),
      change: `${stats.totalBoxesChange.toFixed(1)}%`,
      isPositive: stats.totalBoxesIsPositive,
      icon: <FileText className="h-4 w-4" />
    },
    {
      key: 'totalUsers',
      value: stats.totalUsers.toString(),
      change: `${stats.totalUsersChange.toFixed(1)}%`,
      isPositive: stats.totalUsersIsPositive,
      icon: <Users className="h-4 w-4" />
    },
    {
      key: 'totalDonations',
      value: formatCurrency(stats.totalDonations),
      change: `${stats.totalDonationsChange.toFixed(1)}%`,
      isPositive: stats.totalDonationsIsPositive,
      icon: <Heart className="h-4 w-4" />
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsItems.map((stat) => (
        <Card key={stat.key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t(`dashboard.stats.${stat.key}`)}
            </CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t(`dashboard.stats.${stat.key}Desc`)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              <span className={stat.isPositive ? 'text-green-500' : 'text-red-500'}>
                {stat.isPositive ? '+' : ''}{stat.change} · {' '}
                {t(`dashboard.stats.${stat.key}${stat.isPositive ? 'Up' : 'Down'}`)}
              </span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
