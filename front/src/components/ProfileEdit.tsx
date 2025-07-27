import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { updateUserProfile } from '@/lib/profile';

export function ProfileEdit({ user }: { user: any }) {
  const [form, setForm] = useState({ username: user.username, email: user.email });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserProfile({ ...user, ...form });
      toast.success('资料更新成功');
    } catch (err) {
      toast.error('资料更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
      <Input
        name="username"
        value={form.username}
        onChange={handleChange}
        placeholder="用户名"
        disabled={loading}
      />
      <Input
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="邮箱"
        disabled={loading}
      />
      <Button type="submit" disabled={loading}>
        {loading ? '保存中...' : '保存修改'}
      </Button>
    </form>
  );
}
