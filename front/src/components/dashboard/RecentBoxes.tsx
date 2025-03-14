'use client';

import { useEffect, useState } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { dashboardAPI } from '@/services/api';

type BoxData = {
  id: string;
  name: string;
  price: number;
  original_price: number;
  discount: number;
  created_at: string;
  status: string;
  category: string;
  image_url: string;
};

export function RecentBoxes() {
  const [data, setData] = useState<BoxData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getRecentBoxes();
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
        <p>加载盲盒数据出错: {error}</p>
      </div>
    );
  }

  if (!data.length) return <p>暂无数据</p>;

  return (
    <div className="space-y-4">
      {data.map((box) => (
        <div key={box.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative w-16 h-16 rounded-md overflow-hidden">
              <Image 
                src={box.image_url} 
                alt={box.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{box.name}</h3>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <span>{box.category}</span>
                <span>•</span>
                <span className={box.status === 'sold' ? 'text-red-500' : 'text-green-500'}>
                  {box.status === 'sold' ? '已售出' : '可购买'}
                </span>
              </div>
              <div className="flex items-center mt-1">
                <span className="text-primary font-bold">¥{box.price.toFixed(2)}</span>
                <span className="text-gray-400 line-through text-xs ml-2">¥{box.original_price.toFixed(2)}</span>
                <span className="text-red-500 text-xs ml-2">-{box.discount}%</span>
              </div>
            </div>
          </div>
          <Link 
            href={`/boxes/${box.id}`} 
            className="text-primary hover:text-primary/90 flex items-center"
          >
            <span className="mr-1 text-sm">查看</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      ))}
      
      <div className="pt-4 text-center">
        <Link 
          href="/boxes" 
          className="text-primary hover:text-primary/90 text-sm font-medium"
        >
          查看全部盲盒 →
        </Link>
      </div>
    </div>
  );
} 