import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { uploadUserAvatar } from '@/lib/users';
import apiClient from '@/lib/api';
import { Pencil } from 'lucide-react';
import { GlobalAvatar } from '@/components/GlobalAvatar';

export function ProfileAvatar({ user }: { user: any }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadUserAvatar(file);
      await apiClient.put('/user/profile', { ...user, avatar: url });
      // 更新 user.avatar 触发 GlobalAvatar 重新渲染
      user.avatar = url;
      toast.success('头像更新成功');
    } catch (err) {
      toast.error('头像上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEditClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <GlobalAvatar user={user} size="lg" />
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full shadow-md border border-border flex items-center justify-center z-10"
          onClick={handleEditClick}
          disabled={uploading}
          aria-label="更换头像"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>
    </div>
  );
}
