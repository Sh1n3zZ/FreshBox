import { useState, useEffect } from 'react';
import { ProductDTO } from '@/lib/blindbox'; // Use the DTO defined in blindbox.ts
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageOpen, RotateCw } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { GlobalProductCover } from '@/components/GlobalProductCover';

interface BlindBoxOpenProps {
  productInfo: ProductDTO | null;
  isOpening: boolean; // Controls the opening animation
  onOpen: () => void; // Trigger the open action
  onReset?: () => void; // Optional: Reset the view to purchase/open again
}

export function BlindBoxOpenDisplay({ productInfo, isOpening, onOpen, onReset }: BlindBoxOpenProps) {
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (productInfo) {
      // Delay showing the result slightly after opening animation finishes
      const timer = setTimeout(() => setShowResult(true), 500); // Adjust timing as needed
      return () => clearTimeout(timer);
    } else {
      setShowResult(false);
    }
  }, [productInfo]);

  return (
    <div className="flex flex-col items-center justify-center p-8 border rounded-lg min-h-[400px] bg-gradient-to-br from-primary/10 via-transparent to-secondary/10">
      <AnimatePresence mode="wait">
        {!productInfo ? (
          <motion.div
            key="open-button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center"
          >
            <motion.div
              animate={isOpening ? { rotate: [0, 10, -10, 10, -10, 0], scale: [1, 1.1, 1, 1.1, 1] } : {}}
              transition={isOpening ? { duration: 0.5, repeat: Infinity, repeatType: "loop" } : {}}
            >
              <PackageOpen size={80} className="mb-4 text-primary mx-auto" />
            </motion.div>
            <h2 className="text-2xl font-semibold mb-2">准备好了吗？</h2>
            <p className="text-muted-foreground mb-6">点击下方按钮开启你的惊喜盲盒！</p>
            <Button size="lg" onClick={onOpen} disabled={isOpening}>
              {isOpening ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  开启中...
                </>
              ) : (
                '开启盲盒'
              )}
            </Button>
          </motion.div>
        ) : (
          showResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">恭喜你获得！</CardTitle>
                  <CardDescription>来自盲盒的惊喜</CardDescription>
                </CardHeader>
                <CardContent className="items-center flex flex-col text-center">
                  <div className="w-48 h-48 mb-4">
                    <GlobalProductCover 
                      cover={productInfo.imageUrl} 
                      size="full" 
                      alt={productInfo.name}
                      className="rounded border"
                    />
                  </div>
                  <h3 className="text-xl font-semibold">{productInfo.name}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{productInfo.description}</p>
                  <div className="flex gap-2 mb-2">
                    <Badge variant="outline">{productInfo.category}</Badge>
                    <Badge variant="secondary">价值: {formatCurrency(productInfo.price)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">生产日期: {formatDate(productInfo.productionDate)}</p>
                </CardContent>
                {onReset && (
                  <CardFooter className="justify-center">
                    <Button variant="outline" onClick={onReset}>再试一次?</Button>
                  </CardFooter>
                )}
              </Card>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
