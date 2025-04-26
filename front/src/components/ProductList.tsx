import React from 'react';
import { ListForm } from './ListForm';
import { productService, Product, ProductListOptions } from '@/lib/product';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CreateProduct } from '@/components/CreateProduct';

interface ProductListProps {
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function ProductList({ }: ProductListProps) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<Product[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(10);
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [_, setEditingProduct] = React.useState<Product | null>(null);

  const fetchData = React.useCallback(async (options: ProductListOptions) => {
    setLoading(true);
    try {
      const response = await productService.listProducts(options);
      setData(response.products);
      setTotal(response.total);
      setPage(response.page);
      setSize(response.size);
    } catch (error) {
      console.error('获取产品列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData({ page, size, ...filters });
  }, [page, size, filters, fetchData]);

  const handleSearch = (keyword: string) => {
    setFilters(prev => ({ ...prev, keyword }));
    setPage(1);
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handleProductCreated = () => {
    fetchData({ page, size, ...filters });
  };

  const handleProductUpdated = () => {
    setEditingProduct(null);
    fetchData({ page, size, ...filters });
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
      header: '价格',
      accessorKey: 'price',
      cell: (row: Product) => formatCurrency(row.price),
    },
    {
      header: '类别',
      accessorKey: 'category',
    },
    {
      header: '状态',
      accessorKey: 'status',
      cell: (row: Product) => (
        <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>
          {row.status === 'available' ? '可用' : 
           row.status === 'in_blind_box' ? '盲盒中' : 
           row.status === 'sold' ? '已售' : 
           row.status === 'expired' ? '已过期' : '未知'}
        </Badge>
      ),
    },
    {
      header: '生产日期',
      accessorKey: 'productionDate',
    },
    {
      header: '保质期(小时)',
      accessorKey: 'shelfLifeHours',
    },
    {
      header: '创建时间',
      accessorKey: 'createdAt',
    },
    {
      header: '操作',
      accessorKey: 'id',
      cell: (row: Product) => (
        <div className="flex gap-2">
          <CreateProduct 
            product={row} 
            readOnly={true} 
          />
          <CreateProduct
            product={row}
            onProductCreated={handleProductUpdated}
          />
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
        { value: 'available', label: '可用' },
        { value: 'in_blind_box', label: '盲盒中' },
        { value: 'sold', label: '已售' },
        { value: 'expired', label: '已过期' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">产品列表</h2>
        <CreateProduct onProductCreated={handleProductCreated} />
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
