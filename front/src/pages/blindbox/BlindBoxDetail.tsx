import { BlindBoxDetail } from '@/lib/blindbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ShoppingCart, Gift } from 'lucide-react';

interface BlindBoxDetailProps {
  box: BlindBoxDetail;
  onPurchase: () => void;
  isPurchasing: boolean;
  canPurchase: boolean; // Whether the purchase button should be enabled
}

export function BlindBoxDetailDisplay({ box, onPurchase, isPurchasing, canPurchase }: BlindBoxDetailProps) {
  const defaultImageUrl = "https://placehold.co/600x400?text=盲盒";

  // Calculate the actual price based on products and discount
  // Note: This calculation assumes the backend provides the products array in the detail.
  // If products are not provided, we might need a separate way to show price or fetch it.
  const originalPrice = box.products?.reduce((sum, product) => sum + product.price, 0) || 0;
  const finalPrice = originalPrice * box.discountCoefficient;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-2xl lg:text-3xl">{box.name}</CardTitle>
        <CardDescription>{box.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        <div className="relative aspect-video">
          <img
            src={box.imageURL || defaultImageUrl}
            alt={`${box.name} image`}
            className="absolute inset-0 h-full w-full object-cover rounded-md border"
            onError={(e) => {
              e.currentTarget.src = defaultImageUrl;
            }}
          />
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">盲盒信息</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>类别: <Badge variant="outline">{box.category}</Badge></p>
              <p>状态: <Badge variant={box.status === 'active' ? 'default' : 'secondary'}>{box.status}</Badge></p>
              <p>过期时间: {formatDate(box.expirationTime)}</p>
              <p>折扣系数: {box.discountCoefficient.toFixed(2)}</p>
              {box.donationAmount > 0 && (
                <p className="flex items-center">
                  <Gift className="h-4 w-4 mr-1 text-pink-500" /> 每售出捐赠: {formatCurrency(box.donationAmount)}
                </p>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-1">价格信息</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              {box.products && box.products.length > 0 && (
                <p>内含商品原价: <span className="line-through">{formatCurrency(originalPrice)}</span></p>
              )}
              <p className="text-lg font-bold text-primary">盲盒价格: {formatCurrency(finalPrice)}</p>
            </div>
          </div>
          
           {box.products && box.products.length > 0 && (
            <div>
              <h3 className="font-semibold mb-1">可能包含的产品 ({box.products.length} 种)</h3>
              <div className="flex flex-wrap gap-2">
                {box.products.map((prod) => (
                  <Badge key={prod.id} variant="secondary">{prod.name}</Badge>
                ))}
              </div>
            </div>
          )}

        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          size="lg" 
          onClick={onPurchase} 
          disabled={!canPurchase || isPurchasing}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          {isPurchasing ? '处理中...' : `购买盲盒 (${formatCurrency(finalPrice)})`}
        </Button>
      </CardFooter>
    </Card>
  );
}
