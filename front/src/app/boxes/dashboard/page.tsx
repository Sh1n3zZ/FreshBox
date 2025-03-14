import { Suspense } from 'react';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { CategoryDistribution } from '@/components/dashboard/CategoryDistribution';
import { UserActivityChart } from '@/components/dashboard/UserActivityChart';
import { DonationStats } from '@/components/dashboard/DonationStats';
import { RecentBoxes } from '@/components/dashboard/RecentBoxes';
import { TopTasks } from '@/components/dashboard/TopTasks';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

export const metadata = {
  title: '仪表盘 | FreshBox',
  description: '盲盒管理系统仪表盘',
};

export default function DashboardPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">系统仪表盘</h1>
      
      <Suspense fallback={<DashboardSkeleton />}>
        {/* 摘要卡片 */}
        <div className="mb-8">
          <DashboardSummary />
        </div>
        
        {/* 图表区域 - 两列布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">收入统计</h2>
            <RevenueChart />
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">盲盒分类分布</h2>
            <CategoryDistribution />
          </div>
        </div>
        
        {/* 用户活跃度和捐赠统计 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">用户活跃度</h2>
            <UserActivityChart />
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">捐赠统计</h2>
            <DonationStats />
          </div>
        </div>
        
        {/* 最近盲盒和任务表现 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">最近创建的盲盒</h2>
            <RecentBoxes />
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">表现最佳的任务</h2>
            <TopTasks />
          </div>
        </div>
      </Suspense>
    </main>
  );
} 