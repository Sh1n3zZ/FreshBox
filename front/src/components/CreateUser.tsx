import React from 'react';
import { User, UpdateUserRequest, CreateUserRequest } from '@/lib/users';
import { userService } from '@/lib/users';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CreateUserProps {
  user?: User;
  readOnly?: boolean;
  onUserCreated?: () => void;
}

export function CreateUser({ user, readOnly = false, onUserCreated }: CreateUserProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<CreateUserRequest>({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'user',
    avatar: user?.avatar || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    setLoading(true);
    try {
      if (user) {
        // 更新用户
        await userService.updateUser(user.id, formData);
        toast.success("用户信息更新成功");
      } else {
        // 创建用户
        await userService.createUser(formData);
        toast.success("用户创建成功");
      }
      setOpen(false);
      onUserCreated?.();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || '未知错误';
      toast.error(`操作失败: ${errorMsg}`);
      console.error('操作失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={user ? "outline" : "default"} size="sm">
          {user ? (readOnly ? "查看" : "编辑") : "创建用户"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? (readOnly ? "查看用户" : "编辑用户") : "创建用户"}</DialogTitle>
          <DialogDescription>
            {user ? (readOnly ? "查看用户详细信息" : "编辑用户信息") : "创建新用户"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={readOnly || loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={readOnly || loading}
              required
            />
          </div>
          {!user && (
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="role">角色</Label>
            <Select
              value={formData.role}
              onValueChange={handleRoleChange}
              disabled={readOnly || loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="user">普通用户</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar">头像URL</Label>
            <Input
              id="avatar"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              disabled={readOnly || loading}
            />
          </div>
          {!readOnly && (
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "提交中..." : "提交"}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
} 