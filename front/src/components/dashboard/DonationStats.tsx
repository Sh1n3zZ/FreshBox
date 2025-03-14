'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { dashboardAPI } from '@/services/api';

type DonationData = {
  month: string;
  amount: number;
  count: number;
};

export function DonationStats() {
  const [data, setData] = useState<DonationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getDonationStats();
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
        <p>加载捐赠数据出错: {error}</p>
      </div>
    );
  }

  if (!data.length) return <p>暂无数据</p>;

  // 计算总额和总次数
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);
  
  // 计算最大值以设置图表高度比例
  const maxAmount = Math.max(...data.map(item => item.amount));

  return (
    <div>
      {/* 总计信息 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">捐赠总额</p>
          <p className="text-2xl font-bold text-emerald-600">¥{totalAmount.toLocaleString('zh-CN')}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">捐赠次数</p>
          <p className="text-2xl font-bold text-blue-600">{totalCount}</p>
        </div>
      </div>
      
      {/* 月度折线图 */}
      <div className="relative h-64 mb-6">
        {/* 金额数据点和连线 */}
        <svg className="w-full h-full" viewBox={`0 0 ${data.length * 30} 100`} preserveAspectRatio="none">
          {/* 连线 */}
          <path
            d={data.map((item, index) => {
              const x = index * 30 + 15;
              const y = 100 - (item.amount / maxAmount) * 80;
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
          />
          
          {/* 数据点 */}
          {data.map((item, index) => {
            const x = index * 30 + 15;
            const y = 100 - (item.amount / maxAmount) * 80;
            return (
              <g key={index}>
                <circle 
                  cx={x} 
                  cy={y} 
                  r="3" 
                  fill="#10b981"
                />
                <text
                  x={x}
                  y={y - 8}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#6b7280"
                >
                  ¥{item.amount}
                </text>
              </g>
            );
          })}
        </svg>
        
        {/* X轴标签 */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
          {data.map((item, index) => (
            <div key={index} className="text-center">
              {item.month}
            </div>
          ))}
        </div>
      </div>
      
      {/* 表格数据 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 px-3 text-left">月份</th>
              <th className="py-2 px-3 text-right">捐赠金额</th>
              <th className="py-2 px-3 text-right">捐赠次数</th>
              <th className="py-2 px-3 text-right">平均每次</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-3">{item.month}</td>
                <td className="py-2 px-3 text-right">¥{item.amount.toLocaleString('zh-CN')}</td>
                <td className="py-2 px-3 text-right">{item.count}</td>
                <td className="py-2 px-3 text-right">¥{(item.amount / item.count).toFixed(2)}</td>
              </tr>
            ))}
            <tr className="font-medium bg-gray-50">
              <td className="py-2 px-3">总计</td>
              <td className="py-2 px-3 text-right">¥{totalAmount.toLocaleString('zh-CN')}</td>
              <td className="py-2 px-3 text-right">{totalCount}</td>
              <td className="py-2 px-3 text-right">¥{(totalAmount / totalCount).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
} 