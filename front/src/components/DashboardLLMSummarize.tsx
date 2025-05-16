import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Brain, RefreshCw, AlertTriangle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { dashboardService, LLMSummaryResponse } from '@/lib/dashboard'

export function DashboardLLMSummarize() {
  const { t } = useTranslation()
  const [summary, setSummary] = useState<LLMSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchSummary = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await dashboardService.getLLMSummary()
      setSummary(data)
    } catch (err) {
      setError(t('dashboard.llm.error'))
      console.error('获取AI总结失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      setError(null)
      const data = await dashboardService.getLLMSummary()
      setSummary(data)
    } catch (err) {
      setError(t('dashboard.llm.error'))
      console.error('刷新AI总结失败:', err)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium">
          <div className="flex items-center">
            <Brain className="mr-2 h-4 w-4" />
            {t('dashboard.llm.title')}
          </div>
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={loading || refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          {t('dashboard.llm.refresh')}
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[95%]" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[85%]" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : summary ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t('dashboard.llm.summaryLabel')}</p>
              <p className="text-sm">{summary.summary}</p>
            </div>
            
            {summary.insights.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">{t('dashboard.llm.insightsLabel')}</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {summary.insights.map((insight, index) => (
                    <li key={index} className="text-sm">{insight}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {summary.recommendations.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">{t('dashboard.llm.recommendationsLabel')}</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {summary.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm">{recommendation}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        {summary?.status === 'cached' ? t('dashboard.llm.cachedResult') : ''}
        {summary ? t('dashboard.llm.lastUpdate', { time: new Date().toLocaleString() }) : ''}
      </CardFooter>
    </Card>
  )
}
