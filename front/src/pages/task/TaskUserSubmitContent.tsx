import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { uploadTaskCover, createTaskSubmission } from '@/lib/task'
import { GlobalTaskCover } from '@/components/GlobalTaskCover'

// TaskUserSubmitContent 组件用于提交任务作品
export default function TaskUserSubmitContent({ onSuccess }: { onSuccess?: () => void }) {
  const { id: taskId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理图片选择
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    setImages(files)
    setImageUrls([])
    setUploading(true)
    try {
      // 上传所有图片，获取 URL
      const urls: string[] = []
      for (const file of files) {
        const url = await uploadTaskCover(file)
        urls.push(url)
      }
      setImageUrls(urls)
    } catch (err) {
      setError('图片上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  // 触发文件选择
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '' // 允许重复选择同一文件
      fileInputRef.current.click()
    }
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim() || !description.trim() || imageUrls.length === 0) {
      setError('请填写完整信息并上传图片')
      return
    }
    setSubmitting(true)
    try {
      await createTaskSubmission(taskId as string, {
        title,
        description,
        images: imageUrls
      })
      if (onSuccess) onSuccess()
      else navigate(`/task/detail/${taskId}?tab=submissions`)
    } catch (err) {
      setError('提交失败，请稍后再试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>提交作品</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Input
            placeholder="作品标题"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <Textarea
            placeholder="请描述您的创作过程和成果"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
          {/* 隐藏的文件选择器 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleImageChange}
            disabled={uploading}
          />
          <Button type="button" variant="outline" onClick={handleUploadClick} disabled={uploading}>
            {uploading ? '图片上传中...' : (imageUrls.length > 0 ? '重新上传图片' : '上传图片')}
          </Button>
          {/* 图片预览，使用 GlobalTaskCover 统一风格 */}
          {imageUrls.length > 0 && (
            <div className="flex gap-4 flex-wrap">
              {imageUrls.map((url, i) => (
                <div key={i} className="w-32">
                  <GlobalTaskCover cover={url.replace(/^https?:\/\//, '/')} size="sm" alt={`预览${i+1}`} />
                </div>
              ))}
            </div>
          )}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {/* 上传和提交按钮间的间隔 */}
          <div className="h-6" />
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={submitting || uploading} className="w-full">
            {submitting ? '提交中...' : '提交作品'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
