import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function BoxDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 左侧图片骨架 */}
      <div className="space-y-4">
        <Skeleton className="aspect-square rounded-lg" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      </div>

      {/* 右侧信息骨架 */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-12 w-1/3" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="details">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1" disabled>
              商品详情
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="flex-1" disabled>
              营养信息
            </TabsTrigger>
            <TabsTrigger value="merchant" className="flex-1" disabled>
              商家信息
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-4">
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-16 rounded-full" />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 