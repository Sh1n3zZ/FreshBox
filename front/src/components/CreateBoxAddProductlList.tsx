import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, MinusCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { productService, Product } from '@/lib/product';
import { formatCurrency } from '@/lib/utils';
import { toast } from "sonner";

interface CreateBoxAddProductlListProps {
  availableProducts: Product[];
  selectedProducts: Product[];
  onSelectProduct: (product: Product) => void;
  onDeselectProduct: (product: Product) => void;
  readOnly?: boolean;
  isLoading?: boolean;
}

export function CreateBoxAddProductlList({
  availableProducts,
  selectedProducts,
  onSelectProduct,
  onDeselectProduct,
  readOnly = false,
  isLoading = false
}: CreateBoxAddProductlListProps) {
  const [allAvailableProducts, setAllAvailableProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false); // 初始设为 false，等数据加载后再确定
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  // Load products function
  const loadProducts = useCallback(async (page: number, reset: boolean = false) => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const response = await productService.getProductsByStatus('available', page, pageSize);
      
      if (reset) {
        setAllAvailableProducts(response.products);
        setCurrentPage(page);
      } else {
        setAllAvailableProducts(prev => [...prev, ...response.products]);
        setCurrentPage(page);
      }
      
      setTotalProducts(response.total);
      // 修复 hasMore 的计算逻辑
      const hasMorePages = (page * pageSize) < response.total;
      setHasMore(hasMorePages);
    } catch (error) {
      toast.error("加载产品失败");
      console.error('加载产品失败:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [pageSize]);

  // Load initial products
  useEffect(() => {
    loadProducts(1, true);
  }, [loadProducts]);

  // Handle scroll to bottom
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
    
    if (isAtBottom && hasMore && !isLoadingMore) {
      loadProducts(currentPage + 1);
    }
  }, [hasMore, isLoadingMore, currentPage, loadProducts]);

  // Handle manual pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      loadProducts(currentPage - 1, true);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      loadProducts(currentPage + 1, true);
    }
  };

  // Filter out already selected products
  const filteredAvailableProducts = allAvailableProducts.filter(
    product => !selectedProducts.some(selected => selected.id === product.id)
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <p>加载产品中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium mb-2">可选产品</h4>
          <ScrollArea 
            ref={scrollAreaRef}
            className="h-64 w-full rounded-md border p-2"
            onScroll={handleScroll}
          >
            {filteredAvailableProducts.length > 0 ? (
              <>
                {filteredAvailableProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-2 hover:bg-accent rounded">
                    <div className="flex-1">
                      <h5 className="font-medium">{product.name}</h5>
                      <div className="text-sm text-muted-foreground">
                        <p>{formatCurrency(product.price)}</p>
                        <p>类别: {product.category}</p>
                      </div>
                    </div>
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectProduct(product)}
                        aria-label={`选择 ${product.name}`}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {isLoadingMore && (
                  <div className="flex justify-center py-2">
                    <p className="text-sm text-muted-foreground">加载更多...</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground p-1">暂无可用产品</p>
            )}
          </ScrollArea>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">已选产品</h4>
          <ScrollArea className="h-64 w-full rounded-md border p-2">
            {selectedProducts.length > 0 ? (
              selectedProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-2 hover:bg-accent rounded">
                  <div className="flex-1">
                    <h5 className="font-medium">{product.name}</h5>
                    <div className="text-sm text-muted-foreground">
                      <p>{formatCurrency(product.price)}</p>
                      <p>类别: {product.category}</p>
                    </div>
                  </div>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeselectProduct(product)}
                      aria-label={`移除 ${product.name}`}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground p-1">尚未选择产品</p>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          共 {totalProducts} 个产品，当前显示 {filteredAvailableProducts.length} 个
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage <= 1 || isLoadingMore}
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>
          <span className="text-sm">
            第 {currentPage} 页 (共 {Math.ceil(totalProducts / pageSize)} 页)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!hasMore || isLoadingMore}
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      

    </div>
  );
}
