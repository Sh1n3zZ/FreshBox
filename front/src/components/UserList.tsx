import React from 'react';
import { ListForm } from './ListForm';
import { userService, User, UserListOptions } from '@/lib/users';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { CreateUser } from '@/components/CreateUser';

interface UserListProps {
  // 移除不使用的props
}

export function UserList({}: UserListProps) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<User[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(10);
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<User | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchData = async (options: UserListOptions) => {
    setLoading(true);
    try {
      const response = await userService.listUsers(options);
      setData(response.users);
      setTotal(response.total);
      setPage(response.page);
      setSize(response.size);
    } catch (error) {
      console.error('获取用户列表失败:', error);
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

  const handleUserCreated = () => {
    fetchData({ page, size, ...filters });
  };

  const handleDeleteClick = (user: User) => {
    setDeleteTarget(user);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      await userService.deleteUser(deleteTarget.id);
      toast.success("用户删除成功");
      // 刷新列表
      fetchData({ page, size, ...filters });
    } catch (error: any) {
      const errorMsg = error.response?.data?.details || error.message;
      toast.error(`删除用户失败: ${errorMsg}`);
      console.error('删除用户失败:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteAlertOpen(false);
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      header: '用户名',
      accessorKey: 'username',
    },
    {
      header: '邮箱',
      accessorKey: 'email',
    },
    {
      header: '角色',
      accessorKey: 'role',
      cell: (row: User) => (
        <Badge variant={row.role === 'admin' ? 'default' : 'secondary'}>
          {row.role === 'admin' ? '管理员' : '普通用户'}
        </Badge>
      ),
    },
    {
      header: '创建时间',
      accessorKey: 'createdAt',
    },
    {
      header: '操作',
      accessorKey: 'id',
      cell: (row: User) => (
        <div className="flex gap-2">
          <CreateUser 
            user={row} 
            readOnly={true} 
          />
          <CreateUser
            user={row}
            onUserCreated={handleUserCreated}
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
      key: 'role',
      label: '角色',
      options: [
        { value: '', label: '全部' },
        { value: 'admin', label: '管理员' },
        { value: 'user', label: '普通用户' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">用户列表</h2>
        <CreateUser onUserCreated={handleUserCreated} />
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
            <AlertDialogTitle>确认删除用户</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除用户 "{deleteTarget?.username}" 吗？此操作不可撤销。
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
