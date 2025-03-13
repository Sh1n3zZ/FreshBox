import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Box } from '@/lib/contracts/box';
import { useBoxPrice } from '@/hooks/useBoxPrice';

interface BoxCardProps {
  box: Box;
}

export function BoxCard({ box }: BoxCardProps) {
  const { currentPrice, remainingHours, discountPercentage } = useBoxPrice({
    originalPrice: box.originalPrice,
    expiryDate: box.expiryDate,
  });

  return (
    <Card className="group overflow-hidden">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={box.images[0]}
          alt={box.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        {discountPercentage > 0 && (
          <Badge className="absolute top-2 right-2 bg-red-500">
            -{discountPercentage}%
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-2">{box.name}</h3>
          <Badge variant="outline">{box.category}</Badge>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-sm">剩余：{box.quantity}份</span>
          <span className="text-sm">·</span>
          <span className="text-sm">
            {remainingHours > 0 ? `${remainingHours}小时后过期` : '即将过期'}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">¥{currentPrice}</span>
          {discountPercentage > 0 && (
            <span className="text-sm text-muted-foreground line-through">
              ¥{box.originalPrice}
            </span>
          )}
        </div>
        <Button asChild>
          <Link href={`/boxes/${box.id}`}>立即购买</Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 