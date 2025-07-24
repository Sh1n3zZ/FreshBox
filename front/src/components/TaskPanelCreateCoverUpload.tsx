import React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImagePlus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadTaskCover } from '@/lib/task'

interface TaskPanelCreateCoverUploadProps {
  value?: string
  onChange: (url: string) => void
  className?: string
}

export function TaskPanelCreateCoverUpload({ value, onChange, className }: TaskPanelCreateCoverUploadProps) {
  const [loading, setLoading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    // 检查文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB')
      return
    }

    setLoading(true)

    try {
      const url = await uploadTaskCover(file)
      onChange(url)
      toast.success('上传成功')
    } catch (error) {
      console.error('上传失败:', error)
      toast.error('上传失败，请重试')
    } finally {
      setLoading(false)
      // 清空 input，这样用户可以重新上传同一个文件
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="mr-2 h-4 w-4" />
        )}
        {value ? '更换封面' : '上传封面'}
      </Button>
    </div>
  )
}
