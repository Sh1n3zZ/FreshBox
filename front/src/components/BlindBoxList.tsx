import React from 'react';
import { ListForm } from './ListForm';
import { blindboxService, BlindBox, BlindBoxListOptions } from '@/lib/blindbox';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreateBox } from '@/components/CreateBox';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface BlindBoxListProps {
  // 移除不使用的props
}

export function BlindBoxList({}: BlindBoxListProps) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<BlindBox[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(10);
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<BlindBox | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

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

  const handleBoxCreated = () => {
    fetchData({ page, size, ...filters });
  };

  const handleDeleteClick = (box: BlindBox) => {
    setDeleteTarget(box);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      await blindboxService.deleteBlindBox(deleteTarget.id);
      toast.success("盲盒删除成功");
      // 刷新列表
      fetchData({ page, size, ...filters });
    } catch (error: any) {
      const errorMsg = error.response?.data?.details || error.message;
      toast.error(`删除盲盒失败: ${errorMsg}`);
      console.error('删除盲盒失败:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteAlertOpen(false);
      setDeleteTarget(null);
    }
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
          <CreateBox
            box={row}
            readOnly={true}
          />
          <CreateBox
            box={row}
            onBoxCreated={handleBoxCreated}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
            onClick={() => handleDeleteClick(row)}
          >
            <span className="sr-only">删除</span>
            <Trash2 className="h-4 w-4" />
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
        { value: '烘焙', label: '烘焙' },
        { value: '乳制品', label: '乳制品' },
        { value: '零食', label: '零食' },
        { value: '饮品', label: '饮品' },
        { value: '果蔬', label: '果蔬' },
        { value: '其他', label: '其他' },
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
        <CreateBox onBoxCreated={handleBoxCreated} />
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

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除盲盒</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除盲盒 "{deleteTarget?.name}" 吗？此操作不可撤销，且只有当盲盒中没有商品且没有相关订单时才能删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
