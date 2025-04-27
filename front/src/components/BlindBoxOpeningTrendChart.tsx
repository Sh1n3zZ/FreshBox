"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { dashboardService, BlindBoxOpeningTrendResponse } from "@/lib/dashboard"
import { format, subDays, subWeeks, subMonths } from 'date-fns'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BlindBoxTrendProps {
  className?: string;
}

const chartConfig = {
  count: {
    label: "开启数量",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function BlindBoxOpeningTrendChart({ className }: BlindBoxTrendProps) {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [trendData, setTrendData] = useState<BlindBoxOpeningTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        setLoading(true);
        const now = new Date();
        let startTime: Date;
        let endTime: Date;

        switch (selectedPeriod) {
          case 'daily':
            startTime = subDays(now, 1);
            endTime = now;
            break;
          case 'weekly':
            startTime = subWeeks(now, 1);
            endTime = now;
            break;
          case 'monthly':
            startTime = subMonths(now, 1);
            endTime = now;
            break;
          default:
            startTime = subMonths(now, 1);
            endTime = now;
        }

        const response = await dashboardService.getBlindBoxOpeningTrend(
          format(startTime, 'yyyy-MM-dd'),
          format(endTime, 'yyyy-MM-dd')
        );
        setTrendData(response);
      } catch (error) {
        console.error('获取趋势数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
  }, [selectedPeriod]);

  const getPeriodRangeText = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'daily':
        return format(subDays(now, 1), 'yyyy-MM-dd');
      case 'weekly':
        return format(subWeeks(now, 1), 'yyyy-MM-dd');
      case 'monthly':
        return format(subMonths(now, 1), 'yyyy-MM-dd');
      default:
        return format(subMonths(now, 1), 'yyyy-MM-dd');
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-medium">
            {t('dashboard.charts.blindBoxTrend.title')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.charts.blindBoxTrend.description', { date: getPeriodRangeText() })}
          </CardDescription>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('dashboard.charts.blindBoxTrend.selectPeriod')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">{t('dashboard.charts.blindBoxTrend.daily')}</SelectItem>
            <SelectItem value="weekly">{t('dashboard.charts.blindBoxTrend.weekly')}</SelectItem>
            <SelectItem value="monthly">{t('dashboard.charts.blindBoxTrend.monthly')}</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
          </div>
        ) : trendData?.data?.data && trendData.data.data.length > 0 ? (
          <ChartContainer config={chartConfig}>
            <AreaChart
              accessibilityLayer
              data={trendData.data.data}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(5)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                dataKey="count"
                type="natural"
                fill="var(--color-count)"
                fillOpacity={0.4}
                stroke="var(--color-count)"
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-sm text-muted-foreground">{t('dashboard.charts.blindBoxTrend.noData')}</div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              {trendData?.data?.trendPercentage ? (
                <>
                  {trendData.data.trendPercentage > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  {t('dashboard.charts.blindBoxTrend.trend', {
                    percentage: Math.abs(trendData.data.trendPercentage).toFixed(1),
                    direction: trendData.data.trendPercentage > 0 ? 'up' : 'down',
                  })}
                </>
              ) : (
                t('dashboard.charts.blindBoxTrend.noTrend')
              )}
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {t('dashboard.charts.blindBoxTrend.period', { date: getPeriodRangeText() })}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
