"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Box } from '@/lib/contracts/box';
import { useBoxPrice } from '@/hooks/useBoxPrice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { CertificateService } from '@/lib/services/certificate';
import { APIClient } from '@/lib/api/client';
import { CategoryBadge } from './CategoryBadge';
import { BoxService } from '@/lib/services/box-service';

// 处理图片url，返回完整的路径
function getImageUrl(imageUrl: string): string {
  if (!imageUrl) return '/images/box-placeholder.jpg';
  
  // 如果是完整的URL（以http或https开头），直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // 如果是相对路径并以/static开头，添加API基础URL
  if (imageUrl.startsWith('/static')) {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || '';
    const baseUrl = apiBase.split('/api')[0];
    return `${baseUrl}${imageUrl}`;
  }
  
  // 如果以/开头的相对路径，视为相对于当前域名的路径
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  // 其他情况，默认为相对于public目录的图片
  return `/${imageUrl}`;
}

interface BoxDetailProps {
  box: Box;
}

export function BoxDetail({ box }: BoxDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const { formattedPrice, formattedDiscount, daysUntilExpiry, currentPrice } = useBoxPrice(box);
  const [processedImage, setProcessedImage] = useState<string>('/images/box-placeholder.jpg');
  
  // 处理图片逻辑
  useEffect(() => {
    if (box.imageUrl) {
      const imageUrl = getImageUrl(box.imageUrl);
      console.log("[BoxDetail] 原始图片路径:", box.imageUrl);
      console.log("[BoxDetail] 处理后图片路径:", imageUrl);
      setProcessedImage(imageUrl);
    }
  }, [box.imageUrl]);
  
  // 计算小时数（1天 = 24小时）
  const remainingHours = daysUntilExpiry * 24;
  
  // 将折扣从字符串转成数字（去掉百分号），确保是数字
  const discountPercentage = formattedDiscount ? parseInt(formattedDiscount, 10) || 0 : 0;

  const handlePurchase = async () => {
    try {
      const api = APIClient.getInstance();
      const response = await api.client.post('/api/v1/boxes/' + box.id + '/purchase', {
        boxId: box.id,
        quantity,
        paymentMethod: 'wechat', // 默认微信支付
      });

      // 检查响应
      if (response.data && response.data.code === 200 && response.data.data && response.data.data.orderId) {
        // 生成公益证书
        const certificateService = CertificateService.getInstance();
        const certificate = await certificateService.generateCertificate(response.data.data.orderId);
        // TODO: 显示证书
        console.log('购买成功，订单ID:', response.data.data.orderId);
      } else {
        console.error('购买响应无效:', response.data);
      }
    } catch (error) {
      console.error('购买失败:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 左侧图片展示 */}
      <div className="space-y-4">
        <div className="relative aspect-square rounded-lg overflow-hidden bg-white">
          <Image
            src={processedImage}
            alt={box.name || '盲盒图片'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              console.error("[BoxDetail] 图片加载失败:", processedImage);
              // 替换为默认图片
              (e.target as HTMLImageElement).src = '/images/box-placeholder.jpg';
            }}
          />
          {discountPercentage > 0 && (
            <Badge className="absolute top-4 right-4 bg-red-500 text-lg">
              -{discountPercentage}%
            </Badge>
          )}
        </div>
      </div>

      {/* 右侧信息 */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{box.name}</h1>
            {box.category && <CategoryBadge category={box.category} size="lg" />}
          </div>
          <p className="text-muted-foreground">{box.description}</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-baseline gap-4 mb-4">
              <span className="text-4xl font-bold">¥{formattedPrice || '0.00'}</span>
              {discountPercentage > 0 && box.originalPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  ¥{typeof box.originalPrice === 'number' ? box.originalPrice.toFixed(2) : box.originalPrice}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>剩余数量</span>
                <span>{box.quantity || 1}份</span>
              </div>
              <div className="flex items-center justify-between text-red-500">
                <span>距离过期</span>
                <span>
                  {remainingHours > 0 ? `${Math.floor(remainingHours)}小时` : '即将过期'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span>购买数量</span>
                <Input
                  type="number"
                  min={1}
                  max={box.quantity || 1}
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
            {box.merchant && <TabsTrigger value="merchant" className="flex-1">商家信息</TabsTrigger>}
          </TabsList>
          <TabsContent value="details" className="space-y-4">
            <h3 className="font-semibold">商品标签</h3>
            <div className="flex flex-wrap gap-2">
              {box.tags?.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              )) || <span className="text-muted-foreground">暂无标签</span>}
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
          {box.merchant && (
            <TabsContent value="merchant">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden">
                      <Image
                        src={box.merchant.logo ? getImageUrl(box.merchant.logo) : '/images/merchant-placeholder.jpg'}
                        alt={box.merchant.name || '商家图片'}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          console.error("[BoxDetail] 商家图片加载失败");
                          (e.target as HTMLImageElement).src = '/images/merchant-placeholder.jpg';
                        }}
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
          )}
        </Tabs>
      </div>
    </div>
  );
} 