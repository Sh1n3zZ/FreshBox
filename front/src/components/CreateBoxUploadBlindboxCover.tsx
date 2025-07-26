import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, X } from 'lucide-react';
import { blindboxService } from '@/lib/blindbox';
import { toast } from 'sonner';
import { GlobalBlindboxCover } from '@/components/GlobalBlindboxCover';

interface CreateBoxUploadBlindboxCoverProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CreateBoxUploadBlindboxCover({ value, onChange, disabled = false }: CreateBoxUploadBlindboxCoverProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSelectFile = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await blindboxService.uploadBlindboxCover(file);
      if (url) {
        onChange(url);
        toast.success('封面上传成功');
      } else {
        toast.error('上传失败，未返回URL');
      }
    } catch (error: any) {
      const msg = error.response?.data?.msg || error.message;
      toast.error(`上传失败: ${msg}`);
      console.error('Upload blindbox cover failed', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (disabled) return;
    onChange('');
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-full h-48 rounded-lg overflow-hidden">
          <GlobalBlindboxCover cover={value} size="full" />
          {!disabled && (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={handleRemove}
              aria-label="删除封面"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center border-dashed border-2 border-muted-foreground/40 rounded-lg h-48 cursor-pointer hover:bg-muted transition-colors"
          onClick={handleSelectFile}
        >
          {isUploading ? (
            <p>上传中...</p>
          ) : (
            <>
              <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">点击上传盲盒封面</p>
            </>
          )}
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
    </div>
  );
}
