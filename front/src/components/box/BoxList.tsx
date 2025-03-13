import { useState } from 'react';
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
import type { Box, BoxListParams } from '@/lib/contracts/box';

async function getBoxes(params: BoxListParams) {
  const api = APIClient.getInstance();
  const response = await api.client.get('/api/boxes', { params });
  return response.data;
}

export async function BoxList() {
  const [searchParams, setSearchParams] = useState<BoxListParams>({
    page: 1,
    pageSize: 12,
    sortBy: 'expiry',
    order: 'asc',
  });

  const { boxes, total } = await getBoxes(searchParams);

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