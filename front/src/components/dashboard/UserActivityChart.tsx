'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { dashboardAPI } from '@/services/api';

type ActivityData = {
  date: string;
  active_users: number;
  new_users: number;
  purchases: number;
};

export function UserActivityChart() {
  const [data, setData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleDays, setVisibleDays] = useState(14); // 默认显示14天

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getUserActivity();
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
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>加载用户活跃度数据出错: {error}</p>
      </div>
    );
  }

  if (!data.length) return <p>暂无数据</p>;

  // 截取要显示的天数
  const visibleData = data.slice(-visibleDays);
  
  // 计算最大值以设置图表高度比例
  const maxActiveUsers = Math.max(...visibleData.map(item => item.active_users));
  const maxNewUsers = Math.max(...visibleData.map(item => item.new_users));
  const maxValue = Math.max(maxActiveUsers, maxNewUsers);

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-2">
        <div className="inline-flex rounded-md shadow-sm bg-gray-100" role="group">
          <button 
            type="button" 
            className={`px-4 py-1 text-xs rounded-l-md ${visibleDays === 7 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setVisibleDays(7)}
          >
            7天
          </button>
          <button 
            type="button" 
            className={`px-4 py-1 text-xs ${visibleDays === 14 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setVisibleDays(14)}
          >
            14天
          </button>
          <button 
            type="button" 
            className={`px-4 py-1 text-xs rounded-r-md ${visibleDays === 30 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setVisibleDays(30)}
          >
            30天
          </button>
        </div>
      </div>
      
      {/* 图表容器 */}
      <div className="relative h-64">
        {/* 活跃用户和新用户线 */}
        <svg className="w-full h-full" viewBox={`0 0 ${visibleData.length * 30} 100`} preserveAspectRatio="none">
          {/* 活跃用户线 */}
          <path
            d={visibleData.map((item, index) => {
              const x = index * 30 + 15;
              const y = 100 - (item.active_users / maxValue) * 80;
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            fill="none"
            stroke="#3b82f6" // 蓝色
            strokeWidth="2"
          />
          
          {/* 新用户线 */}
          <path
            d={visibleData.map((item, index) => {
              const x = index * 30 + 15;
              const y = 100 - (item.new_users / maxValue) * 80;
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            fill="none"
            stroke="#10b981" // 绿色
            strokeWidth="2"
          />
          
          {/* 数据点 - 活跃用户 */}
          {visibleData.map((item, index) => {
            const x = index * 30 + 15;
            const y = 100 - (item.active_users / maxValue) * 80;
            return (
              <circle 
                key={`active-${index}`}
                cx={x} 
                cy={y} 
                r="3" 
                fill="#3b82f6"
              />
            );
          })}
          
          {/* 数据点 - 新用户 */}
          {visibleData.map((item, index) => {
            const x = index * 30 + 15;
            const y = 100 - (item.new_users / maxValue) * 80;
            return (
              <circle 
                key={`new-${index}`}
                cx={x} 
                cy={y} 
                r="3" 
                fill="#10b981"
              />
            );
          })}
        </svg>
        
        {/* X轴标签 */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
          {visibleData.filter((_, i) => i % Math.ceil(visibleData.length / 7) === 0).map((item, index) => (
            <div key={index} className="text-center">
              {item.date.substring(5)}
            </div>
          ))}
        </div>
        
        {/* Y轴标签 */}
        <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-xs text-gray-500">
          <div>{maxValue}</div>
          <div>{Math.round(maxValue * 0.75)}</div>
          <div>{Math.round(maxValue * 0.5)}</div>
          <div>{Math.round(maxValue * 0.25)}</div>
          <div>0</div>
        </div>
      </div>
      
      {/* 图例 */}
      <div className="flex justify-center space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
          <span className="text-sm">活跃用户</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
          <span className="text-sm">新用户</span>
        </div>
      </div>
      
      {/* 统计数据 */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-sm text-gray-500">平均活跃用户</p>
          <p className="font-bold">{Math.round(visibleData.reduce((sum, item) => sum + item.active_users, 0) / visibleData.length)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">新用户总数</p>
          <p className="font-bold">{visibleData.reduce((sum, item) => sum + item.new_users, 0)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">购买总数</p>
          <p className="font-bold">{visibleData.reduce((sum, item) => sum + item.purchases, 0)}</p>
        </div>
      </div>
    </div>
  );
}
