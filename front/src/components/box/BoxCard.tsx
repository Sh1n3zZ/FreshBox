import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBoxPrice } from '@/hooks/useBoxPrice';
import type { Box } from '@/lib/contracts/box';
import { CategoryBadge } from './CategoryBadge';

// 构建完整的图片URL
function getImageUrl(imageUrl: string): string {
  // 如果是完整的URL（以http或https开头），直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // 如果是相对路径并以/static开头，添加API基础URL
  if (imageUrl.startsWith('/static')) {
    // 从环境变量获取API基础URL，并去掉末尾可能的/api或/api/v1等路径
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

interface BoxCardProps {
  box: Box;
}

export function BoxCard({ box }: BoxCardProps) {
  const { formattedPrice, formattedDiscount, daysUntilExpiry } = useBoxPrice(box);
  
  // 处理图片路径
  const imageUrl = getImageUrl(box.imageUrl);
  console.log("[BoxCard] 原始图片路径:", box.imageUrl);
  console.log("[BoxCard] 处理后图片路径:", imageUrl);

  return (
    <Link href={`/boxes/${box.id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <div className="relative h-48 w-full overflow-hidden bg-white p-2">
          {imageUrl ? (
            <div className="relative h-full w-full overflow-hidden rounded-md bg-white">
              <Image 
                src={imageUrl}
                alt={box.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={(e) => {
                  console.error("[BoxCard] 图片加载失败:", imageUrl);
                  // 替换为默认图片
                  (e.target as HTMLImageElement).src = '/images/box-placeholder.jpg';
                }}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-white rounded-md border border-gray-100">
              <span className="text-gray-500">暂无图片</span>
            </div>
          )}

          <Badge 
            className="absolute top-2 right-2" 
            variant={daysUntilExpiry <= 1 ? "destructive" : daysUntilExpiry <= 3 ? "secondary" : "default"}
          >
            {daysUntilExpiry <= 0 ? '今日到期' : `${daysUntilExpiry}天后到期`}
          </Badge>
          
          {box.category && (
            <div className="absolute top-2 left-2">
              <CategoryBadge category={box.category} size="sm" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{box.name}</h3>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2">{box.description}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold">¥{formattedPrice}</span>
            <span className="text-sm text-gray-500 line-through">¥{box.originalPrice}</span>
          </div>
          <Badge variant="outline" className="text-green-600">
            -{formattedDiscount}%
          </Badge>
        </CardFooter>
      </Card>
    </Link>
  );
}
