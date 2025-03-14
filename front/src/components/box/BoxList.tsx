"use client";

import { useState, useEffect } from 'react';
import { BoxCard } from './BoxCard';
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APIClient } from '@/lib/api/client';
import { BoxListSkeleton } from './BoxListSkeleton';
import type { Box, BoxListParams } from '@/lib/contracts/box';

export function BoxList() {
  const [searchParams, setSearchParams] = useState<BoxListParams>({
    page: 1,
    pageSize: 12,
    sortBy: 'expiry',
    order: 'asc',
  });
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBoxes() {
      setLoading(true);
      try {
        const api = APIClient.getInstance();
        const response = await api.client.get('/boxes', { params: searchParams });
        console.log("[BoxList] 接收到的响应数据:", response.data);
        
        // 修复数据解析：处理嵌套的 data 结构
        if (response.data && response.data.data && response.data.data.boxes) {
          setBoxes(response.data.data.boxes || []);
          setTotal(response.data.data.total || 0);
          console.log("[BoxList] 成功解析盲盒数据:", {
            boxes: response.data.data.boxes.length,
            total: response.data.data.total
          });
        } else {
          console.warn("[BoxList] 无法解析盲盒数据:", response.data);
          setBoxes([]);
          setTotal(0);
        }
      } catch (err) {
        console.error('[BoxList] 获取盲盒列表失败', err);
        setError('获取盲盒列表失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    }
    
    fetchBoxes();
  }, [searchParams]);

  if (loading) return <BoxListSkeleton />;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (boxes.length === 0) return <div className="text-center">暂无盲盒数据</div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Input
          placeholder="搜索盲盒..."
          className="max-w-sm"
          onChange={(e) => setSearchParams(prev => ({ ...prev, search: e.target.value }))}
        />
        <Select
          defaultValue={searchParams.sortBy}
          onValueChange={(value) =>
            setSearchParams(prev => ({ ...prev, sortBy: value as BoxListParams['sortBy'] }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expiry">即将过期</SelectItem>
            <SelectItem value="price">价格优先</SelectItem>
            <SelectItem value="popularity">最受欢迎</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {boxes.map((box: Box) => (
          <BoxCard key={box.id} box={box} />
        ))}
      </div>

      {total > boxes.length && (
        <div className="flex justify-center">
          <button
            className="text-primary hover:underline"
            onClick={() => setSearchParams(prev => ({ ...prev, page: prev.page! + 1 }))}
          >
            加载更多
          </button>
        </div>
      )}
    </div>
  );
} 