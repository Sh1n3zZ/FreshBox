import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { FileText, Upload, X, Copy, Download } from 'lucide-react'
import { API_URLS } from '@/conf/env'

export default function OCR() {
  const [isUploading, setIsUploading] = useState(false)
  const [recognizedText, setRecognizedText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 检查文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/bmp']
    if (!validTypes.includes(file.type)) {
      toast.error('请选择有效的图片文件 (JPEG, PNG, BMP)')
      return
    }

    // 限制文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过10MB')
      return
    }

    setSelectedFile(file)

    // 创建预览URL
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // 上传并处理图片
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('请先选择图片文件')
      return
    }

    setIsUploading(true)
    setRecognizedText('')

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const response = await fetch(API_URLS.OCR.PROCESS, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.msg || '处理失败')
      }

      const data = await response.json()
      
      if (data.code !== 200) {
        throw new Error(data.msg || '处理失败')
      }

      setRecognizedText(data.data.text || data.data || '')
      toast.success('文本识别成功')
    } catch (error) {
      toast.error(`识别失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsUploading(false)
    }
  }

  // 清除选择的文件
  const clearSelection = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setRecognizedText('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 复制文本到剪贴板
  const copyToClipboard = () => {
    if (!recognizedText) return
    
    navigator.clipboard.writeText(recognizedText)
      .then(() => toast.success('已复制到剪贴板'))
      .catch(() => toast.error('复制失败，请手动复制'))
  }

  // 下载文本文件
  const downloadText = () => {
    if (!recognizedText) return
    
    const blob = new Blob([recognizedText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ocr-result.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 添加处理样例图片点击的函数
  const handleExampleClick = async () => {
    try {
      const response = await fetch('/images/example.jpg');
      const blob = await response.blob();
      const file = new File([blob], 'example.jpg', { type: 'image/jpeg' });
      
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
        handleFileChange({ target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>);
      }
    } catch (error) {
      toast.error('加载样例图片失败');
    }
  };

  return (
    <div className="container mx-auto max-w-7xl py-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">OCR 图像识别</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          上传图片，自动识别并提取其中的文本内容
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 上传区域 */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">上传图片</h2>
          
          {/* 拖放区域 */}
          <div
            className={`mb-4 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
              previewUrl ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <div className="relative w-full">
                <img
                  src={previewUrl}
                  alt="预览"
                  className="mx-auto max-h-[200px] max-w-full object-contain"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    clearSelection()
                  }}
                  className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
                <p className="mb-1 text-sm font-medium">点击或拖放图片到此处</p>
                <p className="text-xs text-muted-foreground">
                  支持 JPEG, PNG, BMP 格式图片
                </p>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/jpg,image/bmp"
              onChange={handleFileChange}
            />
          </div>

          {/* 上传按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {isUploading ? '处理中...' : '开始识别'}
            </button>
            <button
              onClick={clearSelection}
              disabled={!selectedFile || isUploading}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              清除
            </button>
          </div>
        </div>

        {/* 识别结果 */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">识别结果</h2>
            {recognizedText && (
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center justify-center rounded-md border p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  title="复制到剪贴板"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={downloadText}
                  className="inline-flex items-center justify-center rounded-md border p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  title="下载文本文件"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="min-h-[200px] rounded-lg border bg-muted/30 p-4 flex items-center justify-center">
            {isUploading ? (
              <div className="flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : recognizedText ? (
              <pre className="whitespace-pre-wrap break-words text-sm w-full">{recognizedText}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <FileText className="mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">识别结果将在这里显示</p>
              </div>
            )}
          </div>
        </div>

        {/*样例展示*/}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">识别样例</h2>
          </div>
          <div 
            className="min-h-[200px] overflow-hidden rounded-lg border cursor-pointer"
            onClick={handleExampleClick}
          >
            <img 
              src="/images/example.jpg" 
              alt="OCR识别样例"
              className="h-full w-full object-cover hover:opacity-90 transition-opacity"
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground text-center">
            点击图片可以直接使用该样例进行识别
          </p>
        </div>
      </div>
    </div>
  )
}