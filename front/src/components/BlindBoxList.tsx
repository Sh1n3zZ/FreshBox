import React from 'react';
import { ListForm } from './ListForm';
import { blindboxService, BlindBox, BlindBoxListOptions } from '@/lib/blindbox';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BlindBoxListProps {
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onCreate?: () => void;
}

export function BlindBoxList({ onView, onEdit, onCreate }: BlindBoxListProps) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<BlindBox[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(10);
  const [filters, setFilters] = React.useState<Record<string, string>>({});

  const fetchData = async (options: BlindBoxListOptions) => {
    setLoading(true);
    try {
      const response = await blindboxService.listBlindBoxes(options);
      setData(response.boxes);
      setTotal(response.total);
      setPage(response.page);
      setSize(response.size);
    } catch (error) {
      console.error('获取盲盒列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData({ page, size, ...filters });
  }, [page, size, filters]);

  const handleSearch = (keyword: string) => {
    setFilters(prev => ({ ...prev, keyword }));
    setPage(1);
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const columns = [
    {
      header: '名称',
      accessorKey: 'name',
    },
    {
      header: '描述',
      accessorKey: 'description',
    },
    {
      header: '折扣系数',
      accessorKey: 'discountCoefficient',
      cell: (row: BlindBox) => row.discountCoefficient.toFixed(2),
    },
    {
      header: '类别',
      accessorKey: 'category',
    },
    {
      header: '状态',
      accessorKey: 'status',
      cell: (row: BlindBox) => (
        <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>
          {row.status === 'active' ? '活跃' : '已下架'}
        </Badge>
      ),
    },
    {
      header: '过期时间',
      accessorKey: 'expirationTime',
    },
    {
      header: '捐赠金额',
      accessorKey: 'donationAmount',
      cell: (row: BlindBox) => formatCurrency(row.donationAmount),
    },
    {
      header: '商品数量',
      accessorKey: 'productCount',
    },
    {
      header: '创建时间',
      accessorKey: 'createdAt',
    },
    {
      header: '操作',
      accessorKey: 'id',
      cell: (row: BlindBox) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(row.id)}
          >
            查看
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(row.id)}
          >
            编辑
          </Button>
        </div>
      ),
    },
  ];

  const filterOptions = [
    {
      key: 'category',
      label: '类别',
      options: [
        { value: '', label: '全部' },
        { value: 'food', label: '食品' },
        { value: 'drink', label: '饮品' },
        { value: 'snack', label: '零食' },
      ],
    },
    {
      key: 'status',
      label: '状态',
      options: [
        { value: '', label: '全部' },
        { value: 'active', label: '活跃' },
        { value: 'inactive', label: '已下架' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">盲盒列表</h2>
        <Button onClick={onCreate}>
          创建盲盒
        </Button>
      </div>
      <ListForm
        columns={columns}
        data={data}
        total={total}
        page={page}
        size={size}
        onPageChange={setPage}
        onSizeChange={setSize}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        filters={filterOptions}
        loading={loading}
      />
    </div>
  );
}
