'use client';

import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, TrendingDown, Users, ShoppingBag, BarChart, Leaf } from 'lucide-react';
import { dashboardAPI } from '@/services/api';

type SummaryData = {
  total_boxes: number;
  boxes_sold_today: number;
  boxes_created_today: number;
  total_users: number;
  active_users_today: number;
  total_revenue: number;
  revenue_today: number;
  donation_amount: number;
  completed_tasks: number;
  tasks_in_progress: number;
  average_discount: string;
  food_waste_prevented: string;
};

export function DashboardSummary() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getSummary();
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>加载摘要数据出错: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {/* 盲盒统计 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 mb-1">总盲盒数</p>
            <h3 className="text-2xl font-bold">{data.total_boxes}</h3>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <ShoppingBag className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div>
            <p className="text-xs text-gray-500">今日创建</p>
            <p className="font-medium">{data.boxes_created_today}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">今日售出</p>
            <p className="font-medium">{data.boxes_sold_today}</p>
          </div>
        </div>
      </div>

      {/* 用户统计 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 mb-1">总用户数</p>
            <h3 className="text-2xl font-bold">{data.total_users}</h3>
          </div>
          <div className="bg-purple-100 p-3 rounded-full">
            <Users className="w-6 h-6 text-purple-500" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs text-gray-500">今日活跃用户</p>
          <div className="flex items-center">
            <p className="font-medium">{data.active_users_today}</p>
            <TrendingUp className="w-4 h-4 text-green-500 ml-2" />
          </div>
        </div>
      </div>

      {/* 收入统计 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 mb-1">总收入</p>
            <h3 className="text-2xl font-bold">¥{data.total_revenue.toLocaleString('zh-CN')}</h3>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <BarChart className="w-6 h-6 text-green-500" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs text-gray-500">今日收入</p>
          <div className="flex items-center">
            <p className="font-medium">¥{data.revenue_today.toLocaleString('zh-CN')}</p>
            {data.revenue_today > 1000 ? (
              <TrendingUp className="w-4 h-4 text-green-500 ml-2" />
            ) : (
              <TrendingDown className="w-4 h-4 text-amber-500 ml-2" />
            )}
          </div>
        </div>
      </div>

      {/* 捐赠与环保统计 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 mb-1">捐赠总额</p>
            <h3 className="text-2xl font-bold">¥{data.donation_amount.toLocaleString('zh-CN')}</h3>
          </div>
          <div className="bg-emerald-100 p-3 rounded-full">
            <Leaf className="w-6 h-6 text-emerald-500" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs text-gray-500">避免食物浪费</p>
          <p className="font-medium">{data.food_waste_prevented}</p>
        </div>
      </div>

      {/* 任务统计 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 mb-1">任务完成数</p>
            <h3 className="text-2xl font-bold">{data.completed_tasks}</h3>
          </div>
          <div className="bg-amber-100 p-3 rounded-full">
            <ShoppingBag className="w-6 h-6 text-amber-500" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs text-gray-500">进行中任务</p>
          <p className="font-medium">{data.tasks_in_progress}</p>
        </div>
      </div>

      {/* 折扣统计 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 mb-1">平均折扣</p>
            <h3 className="text-2xl font-bold">{data.average_discount}</h3>
          </div>
          <div className="bg-rose-100 p-3 rounded-full">
            <TrendingDown className="w-6 h-6 text-rose-500" />
          </div>
        </div>
      </div>
    </div>
  );
} 