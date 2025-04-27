import React from 'react';
import { ListForm } from './ListForm';
import { orderService, BlindBoxOrder, BlindBoxOrderListOptions } from '@/lib/orders';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle2 } from 'lucide-react';
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

interface OrderListProps {
  // 移除不使用的props
}

export function OrderList({}: OrderListProps) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<BlindBoxOrder[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(10);
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<BlindBoxOrder | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchData = async (options: BlindBoxOrderListOptions) => {
    setLoading(true);
    try {
      const response = await orderService.listOrders(options);
      setData(response.orders);
      setTotal(response.total);
      setPage(response.page);
      setSize(response.size);
    } catch (error) {
      console.error('获取订单列表失败:', error);
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

  const handleDeleteClick = (order: BlindBoxOrder) => {
    setDeleteTarget(order);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      await orderService.deleteOrder(deleteTarget.id);
      toast.success("订单删除成功");
      // 刷新列表
      fetchData({ page, size, ...filters });
    } catch (error: any) {
      const errorMsg = error.response?.data?.details || error.message;
      toast.error(`删除订单失败: ${errorMsg}`);
      console.error('删除订单失败:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteAlertOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleMarkAsPaid = async (order: BlindBoxOrder) => {
    try {
      await orderService.markOrderAsPaid(order.id);
      toast.success("订单已标记为已支付");
      // 刷新列表
      fetchData({ page, size, ...filters });
    } catch (error: any) {
      const errorMsg = error.response?.data?.details || error.message;
      toast.error(`标记订单失败: ${errorMsg}`);
      console.error('标记订单失败:', error);
    }
  };

  const columns = [
    {
      header: '订单ID',
      accessorKey: 'id',
    },
    {
      header: '盲盒ID',
      accessorKey: 'blindBoxID',
    },
    {
      header: '用户ID',
      accessorKey: 'userID',
    },
    {
      header: '价格',
      accessorKey: 'price',
      cell: (row: BlindBoxOrder) => formatCurrency(row.price),
    },
    {
      header: '状态',
      accessorKey: 'status',
      cell: (row: BlindBoxOrder) => (
        <Badge variant={row.status === 'paid' ? 'default' : 'secondary'}>
          {row.status === 'pending' ? '待支付' : 
           row.status === 'paid' ? '已支付' : 
           row.status === 'cancelled' ? '已取消' : 
           row.status === 'completed' ? '已完成' : '未知'}
        </Badge>
      ),
    },
    {
      header: '支付方式',
      accessorKey: 'paymentType',
    },
    {
      header: '创建时间',
      accessorKey: 'createdAt',
    },
    {
      header: '支付时间',
      accessorKey: 'paidAt',
    },
    {
      header: '操作',
      accessorKey: 'id',
      cell: (row: BlindBoxOrder) => (
        <div className="flex gap-2">
          {row.status === 'pending' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-success hover:bg-success/10"
              onClick={() => handleMarkAsPaid(row)}
            >
              <span className="sr-only">标记为已支付</span>
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
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
      key: 'status',
      label: '状态',
      options: [
        { value: '', label: '全部' },
        { value: 'pending', label: '待支付' },
        { value: 'paid', label: '已支付' },
        { value: 'cancelled', label: '已取消' },
        { value: 'completed', label: '已完成' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">订单列表</h2>
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
            <AlertDialogTitle>确认删除订单</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除订单 "{deleteTarget?.id}" 吗？此操作不可撤销。
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
