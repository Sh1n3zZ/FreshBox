import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { format, parseISO } from "date-fns"

interface RevenueChartProps {
  className?: string
  timeRange: 'daily' | 'weekly' | 'monthly' | 'yearly'
  getTimeRange: (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => { 
    startDate: string
    endDate: string 
  }
}

interface RevenueData {
  date: string
  revenue: number
}

export function RevenueChart({ className, timeRange, getTimeRange }: RevenueChartProps) {
  const { t } = useTranslation()
  const [data, setData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { startDate, endDate } = getTimeRange(timeRange)
        const response = await fetch(`/api/dashboard/revenue-trend?startDate=${startDate}&endDate=${endDate}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch revenue data')
        }

        const jsonData = await response.json()
        setData(jsonData.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  const formatDate = (date: string) => {
    const parsedDate = parseISO(date)
    switch (timeRange) {
      case 'daily':
        return format(parsedDate, 'MM/dd')
      case 'weekly':
        return format(parsedDate, 'MM/dd')
      case 'monthly':
        return format(parsedDate, 'MM/yyyy')
      case 'yearly':
        return format(parsedDate, 'yyyy')
      default:
        return date
    }
  }

  // 计算同比增长率
  const calculateGrowthRate = () => {
    if (data.length < 2) return 0
    const currentRevenue = data[data.length - 1].revenue
    const previousRevenue = data[0].revenue
    return previousRevenue === 0 ? 0 : ((currentRevenue - previousRevenue) / previousRevenue) * 100
  }

  const growthRate = calculateGrowthRate()

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t('Revenue Trend')}</CardTitle>
        <CardDescription>
          {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(2)}% from previous period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#888888"
              fontSize={12}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              formatter={(value: number) => [`$${value}`, 'Revenue']}
              labelFormatter={(label) => formatDate(label as string)}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
} 