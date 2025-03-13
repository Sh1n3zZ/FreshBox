import Image from 'next/image';
import { useState } from 'react';
import { Box } from '@/lib/contracts/box';
import { useBoxPrice } from '@/hooks/useBoxPrice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { CertificateService } from '@/lib/services/certificate';
import { APIClient } from '@/lib/api/client';

interface BoxDetailProps {
  box: Box;
}

export function BoxDetail({ box }: BoxDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const { currentPrice, remainingHours, discountPercentage } = useBoxPrice({
    originalPrice: box.originalPrice,
    expiryDate: box.expiryDate,
  });

  const handlePurchase = async () => {
    try {
      const api = APIClient.getInstance();
      const response = await api.client.post('/api/orders', {
        boxId: box.id,
        quantity,
        paymentMethod: 'wechat', // 默认微信支付
      });

      // 生成公益证书
      if (response.data.orderId) {
        const certificateService = CertificateService.getInstance();
        const certificate = await certificateService.generateCertificate(response.data.orderId);
        // TODO: 显示证书
      }
    } catch (error) {
      console.error('购买失败:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 左侧图片展示 */}
      <div className="space-y-4">
        <div className="relative aspect-square rounded-lg overflow-hidden">
          <Image
            src={box.images[0]}
            alt={box.name}
            fill
            className="object-cover"
          />
          {discountPercentage > 0 && (
            <Badge className="absolute top-4 right-4 bg-red-500 text-lg">
              -{discountPercentage}%
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {box.images.slice(1).map((image, index) => (
            <div key={index} className="relative aspect-square rounded-md overflow-hidden">
              <Image
                src={image}
                alt={`${box.name}-${index + 2}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 右侧信息 */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{box.name}</h1>
          <p className="text-muted-foreground">{box.description}</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-baseline gap-4 mb-4">
              <span className="text-4xl font-bold">¥{currentPrice}</span>
              {discountPercentage > 0 && (
                <span className="text-xl text-muted-foreground line-through">
                  ¥{box.originalPrice}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>剩余数量</span>
                <span>{box.quantity}份</span>
              </div>
              <div className="flex items-center justify-between text-red-500">
                <span>距离过期</span>
                <span>
                  {remainingHours > 0 ? `${remainingHours}小时` : '即将过期'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span>购买数量</span>
                <Input
                  type="number"
                  min={1}
                  max={box.quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-24"
                />
              </div>
              <Button className="w-full" size="lg" onClick={handlePurchase}>
                立即购买
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="details">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">商品详情</TabsTrigger>
            <TabsTrigger value="nutrition" className="flex-1">营养信息</TabsTrigger>
            <TabsTrigger value="merchant" className="flex-1">商家信息</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-4">
            <h3 className="font-semibold">商品标签</h3>
            <div className="flex flex-wrap gap-2">
              {box.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            {box.allergens && box.allergens.length > 0 && (
              <>
                <h3 className="font-semibold">过敏原信息</h3>
                <p className="text-red-500">{box.allergens.join('、')}</p>
              </>
            )}
          </TabsContent>
          <TabsContent value="nutrition">
            {box.nutritionFacts ? (
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span>热量</span>
                  <span>{box.nutritionFacts.calories} kcal</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>蛋白质</span>
                  <span>{box.nutritionFacts.protein}g</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>碳水化合物</span>
                  <span>{box.nutritionFacts.carbs}g</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>脂肪</span>
                  <span>{box.nutritionFacts.fat}g</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">暂无营养信息</p>
            )}
          </TabsContent>
          <TabsContent value="merchant">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden">
                    <Image
                      src={box.merchant.logo}
                      alt={box.merchant.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{box.merchant.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {box.merchant.address}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 