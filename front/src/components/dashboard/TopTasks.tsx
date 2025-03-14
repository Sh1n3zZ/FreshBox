'use client';

import { useEffect, useState } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { dashboardAPI } from '@/services/api';

type TaskData = {
  id: string;
  title: string;
  participation: number;
  completion_rate: number;
  avg_time: string;
  type: string;
};

// 为不同任务类型设置图标颜色
const taskTypeColors: Record<string, string> = {
  'recipe_challenge': 'bg-amber-100 text-amber-600',
  'sharing': 'bg-blue-100 text-blue-600',
  'donation': 'bg-green-100 text-green-600',
  'photo_challenge': 'bg-purple-100 text-purple-600',
  'recipe_sharing': 'bg-rose-100 text-rose-600',
};

export function TopTasks() {
  const [data, setData] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getTopTasks();
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
        <p>加载任务数据出错: {error}</p>
      </div>
    );
  }

  if (!data.length) return <p>暂无数据</p>;

  return (
    <div className="space-y-4">
      {data.map((task) => (
        <div key={task.id} className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-medium text-gray-900">{task.title}</h3>
              <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${taskTypeColors[task.type] || 'bg-gray-100 text-gray-600'}`}>
                {getTaskTypeName(task.type)}
              </span>
            </div>
            <Link 
              href={`/tasks/${task.id}`} 
              className="text-primary hover:text-primary/90 flex items-center"
            >
              <span className="mr-1 text-xs">详情</span>
              <ExternalLink size={12} />
            </Link>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-xs text-gray-500">参与人数</p>
              <p className="font-medium">{task.participation}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">完成率</p>
              <p className="font-medium">{task.completion_rate}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">平均完成时间</p>
              <p className="font-medium">{task.avg_time}</p>
            </div>
          </div>
          
          {/* 完成率进度条 */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${task.completion_rate}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
      
      <div className="pt-4 text-center">
        <Link 
          href="/tasks" 
          className="text-primary hover:text-primary/90 text-sm font-medium"
        >
          查看全部任务 →
        </Link>
      </div>
    </div>
  );
}

// 任务类型名称转换
function getTaskTypeName(type: string): string {
  const typeNames: Record<string, string> = {
    'recipe_challenge': '食谱挑战',
    'sharing': '分享活动',
    'donation': '捐赠活动',
    'photo_challenge': '拍照挑战',
    'recipe_sharing': '食谱分享',
  };
  
  return typeNames[type] || '其他任务';
} 