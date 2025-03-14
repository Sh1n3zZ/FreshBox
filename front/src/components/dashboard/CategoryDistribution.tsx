'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { dashboardAPI } from '@/services/api';

type CategoryData = {
  name: string;
  count: number;
  percentage: number;
};

// 为不同分类分配不同颜色
const categoryColors: Record<string, string> = {
  '蔬菜水果': '#4ade80', // 绿色
  '乳制品': '#60a5fa', // 蓝色
  '烘焙食品': '#f97316', // 橙色
  '零食': '#facc15', // 黄色
  '饮料': '#8b5cf6', // 紫色
  '其他': '#94a3b8', // 灰色
};

export function CategoryDistribution() {
  const [data, setData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getBoxCategories();
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
        <p>加载分类数据出错: {error}</p>
      </div>
    );
  }

  if (!data.length) return <p>暂无数据</p>;

  return (
    <div>
      {/* 环形图 */}
      <div className="relative h-60 w-60 mx-auto mb-6">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {renderPieChart(data)}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold">{data.reduce((sum, item) => sum + item.count, 0)}</p>
            <p className="text-sm text-gray-500">总盲盒数</p>
          </div>
        </div>
      </div>

      {/* 图例 */}
      <div className="grid grid-cols-2 gap-2">
        {data.map((category, index) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: categoryColors[category.name] || '#94a3b8' }}
            ></div>
            <div className="flex-1 text-sm">{category.name}</div>
            <div className="text-sm font-medium">{category.percentage}%</div>
          </div>
        ))}
      </div>

      {/* 数据表格 */}
      <div className="mt-6 border-t border-gray-100 pt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pb-2">分类</th>
              <th className="pb-2 text-right">数量</th>
              <th className="pb-2 text-right">占比</th>
            </tr>
          </thead>
          <tbody>
            {data.map((category, index) => (
              <tr key={index} className="border-b border-gray-100 last:border-0">
                <td className="py-2">{category.name}</td>
                <td className="py-2 text-right">{category.count}</td>
                <td className="py-2 text-right">{category.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 绘制环形图的辅助函数
function renderPieChart(data: CategoryData[]) {
  let startAngle = 0;
  const radius = 40; // 半径
  const center = 50; // 中心点
  const elements = [];

  for (const category of data) {
    const angle = (category.percentage / 100) * 360;
    const endAngle = startAngle + angle;
    
    // 转换为弧度
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    // 计算路径点
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    
    // 大弧标志
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    // 创建路径
    const d = `M ${center},${center} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;
    
    elements.push(
      <path 
        key={category.name}
        d={d}
        fill={categoryColors[category.name] || '#94a3b8'}
        stroke="white"
        strokeWidth="1"
      />
    );
    
    startAngle = endAngle;
  }
  
  return elements;
} 