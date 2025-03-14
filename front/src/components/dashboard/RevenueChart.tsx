'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { dashboardAPI } from '@/services/api';

type RevenueData = {
  date: string;
  revenue: number;
  boxes: number;
  discount: number;
};

export function RevenueChart() {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getRevenueStats();
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
        <p>加载收入数据出错: {error}</p>
      </div>
    );
  }

  if (!data.length) return <p>暂无数据</p>;

  // 计算最大值以设置图表高度比例
  const maxRevenue = Math.max(...data.map(item => item.revenue));
  const maxBoxes = Math.max(...data.map(item => item.boxes));

  return (
    <div className="space-y-6">
      {/* 图表容器 */}
      <div className="relative h-64">
        {/* 收入柱状图 */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between h-full">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center group">
              <div 
                className="w-12 bg-primary rounded-t transition-all duration-300 group-hover:bg-primary-dark"
                style={{ height: `${(item.revenue / maxRevenue) * 80}%` }}
              ></div>
              <div className="text-xs mt-2 text-gray-600">{item.date.substring(5)}</div>
              
              {/* 工具提示 */}
              <div className="absolute bottom-full mb-2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                收入: ¥{item.revenue.toLocaleString('zh-CN')}<br />
                盲盒数量: {item.boxes}<br />
                平均折扣: {item.discount}%
              </div>
            </div>
          ))}
        </div>
        
        {/* Y轴标签 */}
        <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-xs text-gray-500">
          <div>¥{maxRevenue.toLocaleString('zh-CN')}</div>
          <div>¥{(maxRevenue * 0.75).toLocaleString('zh-CN')}</div>
          <div>¥{(maxRevenue * 0.5).toLocaleString('zh-CN')}</div>
          <div>¥{(maxRevenue * 0.25).toLocaleString('zh-CN')}</div>
          <div>¥0</div>
        </div>
      </div>
      
      {/* 图例 */}
      <div className="flex justify-center space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-primary rounded mr-1"></div>
          <span className="text-sm">收入</span>
        </div>
      </div>
      
      {/* 合计数据 */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-sm text-gray-500">总收入</p>
          <p className="font-bold">¥{data.reduce((sum, item) => sum + item.revenue, 0).toLocaleString('zh-CN')}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">总销售盲盒</p>
          <p className="font-bold">{data.reduce((sum, item) => sum + item.boxes, 0)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">平均折扣</p>
          <p className="font-bold">{Math.round(data.reduce((sum, item) => sum + item.discount, 0) / data.length)}%</p>
        </div>
      </div>
    </div>
  );
} 