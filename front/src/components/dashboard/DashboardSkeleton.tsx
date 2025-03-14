export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* 摘要卡片骨架 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-300 rounded w-24"></div>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="h-3 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-12 mt-1"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 图表区域骨架 - 两列布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="h-5 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="h-64 bg-gray-100 rounded mb-4"></div>
            <div className="flex justify-center space-x-6 mb-4">
              <div className="h-3 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="h-3 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-20 mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 下方图表骨架 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="h-5 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 