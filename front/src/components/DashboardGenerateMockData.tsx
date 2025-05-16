import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, Loader2 } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { dashboardService, MockDataResult } from '@/lib/dashboard'

export function DashboardGenerateMockData() {
  const { t } = useTranslation()
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<MockDataResult | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Mock数据生成参数
  const [boxCount, setBoxCount] = useState(5)
  const [productCount, setProductCount] = useState(20)
  const [userCount, setUserCount] = useState(10)
  const [orderCount, setOrderCount] = useState(30)
  const [openingCount, setOpeningCount] = useState(25)
  const [dayRange, setDayRange] = useState(30)

  const handleGenerateMockData = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      
      const data = await dashboardService.generateMockData({
        boxCount,
        productCount,
        userCount,
        orderCount,
        openingCount,
        dayRange
      })
      
      setResult(data)
      setTimeout(() => setIsOpen(false), 2000) // 生成成功后2秒关闭popover
    } catch (err) {
      console.error('生成模拟数据失败:', err)
      setError(t('dashboard.mockData.error'))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Database className="h-3.5 w-3.5" />
          <span className="hidden sm:inline-block">{t('dashboard.actions.generateMock')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-md font-medium">
              {t('dashboard.mockData.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {result && !isGenerating && (
              <Alert>
                <AlertDescription>
                  {t('dashboard.mockData.success', {
                    users: result.usersCreated,
                    boxes: result.boxesCreated,
                    products: result.productsCreated,
                    orders: result.ordersCreated,
                    openings: result.openingsCreated
                  })}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{t('dashboard.mockData.users')}</span>
                  <span className="text-sm font-medium">{userCount}</span>
                </div>
                <Slider
                  value={[userCount]}
                  min={1}
                  max={50}
                  step={1}
                  onValueChange={(value) => setUserCount(value[0])}
                  disabled={isGenerating}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{t('dashboard.mockData.boxes')}</span>
                  <span className="text-sm font-medium">{boxCount}</span>
                </div>
                <Slider
                  value={[boxCount]}
                  min={1}
                  max={20}
                  step={1}
                  onValueChange={(value) => setBoxCount(value[0])}
                  disabled={isGenerating}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{t('dashboard.mockData.products')}</span>
                  <span className="text-sm font-medium">{productCount}</span>
                </div>
                <Slider
                  value={[productCount]}
                  min={5}
                  max={100}
                  step={5}
                  onValueChange={(value) => setProductCount(value[0])}
                  disabled={isGenerating}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{t('dashboard.mockData.orders')}</span>
                  <span className="text-sm font-medium">{orderCount}</span>
                </div>
                <Slider
                  value={[orderCount]}
                  min={5}
                  max={100}
                  step={5}
                  onValueChange={(value) => setOrderCount(value[0])}
                  disabled={isGenerating}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{t('dashboard.mockData.openings')}</span>
                  <span className="text-sm font-medium">{openingCount}</span>
                </div>
                <Slider
                  value={[openingCount]}
                  min={5}
                  max={100}
                  step={5}
                  onValueChange={(value) => setOpeningCount(value[0])}
                  disabled={isGenerating}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{t('dashboard.mockData.dayRange')}</span>
                  <span className="text-sm font-medium">{dayRange} {t('dashboard.mockData.days')}</span>
                </div>
                <Slider
                  value={[dayRange]}
                  min={7}
                  max={90}
                  step={1}
                  onValueChange={(value) => setDayRange(value[0])}
                  disabled={isGenerating}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-0 pt-2 pb-0 flex justify-end">
            <Button 
              onClick={handleGenerateMockData} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isGenerating 
                ? t('dashboard.mockData.generating') 
                : t('dashboard.mockData.generate')}
            </Button>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
