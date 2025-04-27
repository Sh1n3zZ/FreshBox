import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Upload, 
  X, 
  Info, 
  Check, 
  ArrowLeft, 
  Loader2,
  Home,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { apiService } from '@/lib/api'

// API响应接口
interface ApiResponse {
  data: TaskInfo;
  msg: string;
  trace_id: string;
}

// 任务简要信息接口
interface TaskInfo {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'ongoing' | 'completed';
  created_at: string;
  deadline: string;
  reward: number;
}

// Mock数据
const mockTaskInfo: TaskInfo = {
  id: '1',
  user_id: 'mock-user-id',
  type: 'recipe_challenge',
  title: "夏日清凉料理挑战",
  description: "使用盲盒食材制作清爽的夏日料理，赢取丰厚奖励",
  status: 'pending',
  created_at: "2025-04-26T23:34:38.7470149+08:00",
  deadline: "2025-05-03T23:34:38.7470149+08:00",
  reward: 50
};

export default function TaskSubmit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // 状态
  const [taskInfo, setTaskInfo] = useState<TaskInfo | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 获取任务信息
  useEffect(() => {
    const fetchTaskInfo = async () => {
      setLoading(true);
      
      try {
        const response = await apiService.get<ApiResponse>(`/tasks/${id}`);
        if (response && response.data) {
          setTaskInfo(response.data);
        } else {
          throw new Error('无效的API响应');
        }
      } catch (err) {
        console.error('获取挑战信息失败:', err);
        setError('获取挑战信息失败，请稍后再试');
        
        // 开发环境下使用Mock数据
        if (import.meta.env.DEV) {
          setTaskInfo(mockTaskInfo);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchTaskInfo();
  }, [id]);
  
  // 处理图片上传
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // 验证文件类型
      const validFiles = newFiles.filter(file => 
        file.type.startsWith('image/')
      );
      
      if (validFiles.length !== newFiles.length) {
        toast.error("无效的文件类型", {
          description: "请只上传图片文件"
        });
      }
      
      // 限制最多上传5张图片
      if (images.length + validFiles.length > 5) {
        toast.error("超出文件数量限制", {
          description: "最多只能上传5张图片"
        });
        
        // 只添加能够添加的文件数量
        const allowedCount = 5 - images.length;
        if (allowedCount <= 0) return;
        validFiles.splice(allowedCount);
      }
      
      // 更新文件列表
      setImages(prev => [...prev, ...validFiles]);
      
      // 生成预览URL
      const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };
  
  // 移除图片
  const removeImage = (index: number) => {
    // 释放之前创建的URL对象
    URL.revokeObjectURL(previewUrls[index]);
    
    // 更新状态
    setImages(images.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };
  
  // 提交结果
  const submitResult = async () => {
    // 验证表单
    if (!title.trim()) {
      toast.error("请输入标题", {
        description: "作品标题不能为空"
      });
      return;
    }
    
    if (!description.trim()) {
      toast.error("请输入描述", {
        description: "请描述您的创作过程和成果"
      });
      return;
    }
    
    if (images.length === 0) {
      toast.error("请上传图片", {
        description: "至少需要上传一张作品图片"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // 准备表单数据
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      
      // 添加所有图片
      images.forEach(image => {
        formData.append('images[]', image);
      });
      
      // 发送请求 - 使用原生fetch，因为apiService不直接支持FormData
      const response = await fetch(`/api/v1/tasks/${id}/content`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // 更新任务状态为已完成
      await apiService.put(`/tasks/${id}/status`, { status: 'completed' });
      
      // 提交成功
      toast.success("提交成功", {
        description: "您的作品已成功提交！"
      });
      
      // 导航到详情页
      navigate(`/task/detail/${id}`);
    } catch (err) {
      console.error('提交失败:', err);
      toast.error("提交失败", {
        description: "作品提交失败，请稍后再试"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // 返回到挑战详情页面
  const goBackToDetail = () => {
    navigate(`/task/detail/${id}`);
  };
  
  // 返回到挑战列表
  const goBackToExplore = () => {
    navigate('/task/explore');
  };
  
  // 面包屑导航组件
  const Breadcrumbs = ({ title }: { title: string }) => (
    <nav className="flex mb-4 text-sm items-center">
      <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => navigate('/')}>
        <Home className="h-3.5 w-3.5 mr-1" />
        <span>首页</span>
      </Button>
      <ChevronRight className="h-3 w-3 mx-2 text-muted-foreground" />
      <Button variant="link" size="sm" className="p-0 h-auto" onClick={goBackToExplore}>
        <span>挑战列表</span>
      </Button>
      <ChevronRight className="h-3 w-3 mx-2 text-muted-foreground" />
      <Button variant="link" size="sm" className="p-0 h-auto" onClick={goBackToDetail}>
        <span className="truncate max-w-[150px]" title={title}>
          {title}
        </span>
      </Button>
      <ChevronRight className="h-3 w-3 mx-2 text-muted-foreground" />
      <span className="text-muted-foreground">
        提交作品
      </span>
    </nav>
  );
  
  // 返回按钮组件
  const BackButton = () => (
    <div className="mb-4">
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center text-muted-foreground hover:text-foreground"
        onClick={goBackToDetail}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        返回挑战详情
      </Button>
    </div>
  );
  
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <BackButton />
        <div className="py-12 flex justify-center">
          <div className="animate-spin">
            <Loader2 className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !taskInfo) {
    return (
      <div className="container mx-auto py-6">
        <BackButton />
        <Card>
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="text-xl text-red-500 mb-4">
              {error || '挑战不存在或已被删除'}
            </div>
            <Button onClick={() => navigate('/task/explore')}>
              返回挑战列表
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <BackButton />
      <Breadcrumbs title={taskInfo.title} />
      
      <h1 className="text-2xl font-bold mb-2">提交挑战作品</h1>
      <p className="text-muted-foreground mb-6">
        为"{taskInfo.title}"挑战提交您的创作成果
      </p>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>作品信息</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">作品标题</Label>
            <Input 
              id="title" 
              placeholder="给您的作品起个名字"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">作品描述</Label>
            <Textarea 
              id="description" 
              placeholder="描述您使用了哪些食材，以及如何制作的"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={500}
            />
          </div>
          
          <div className="space-y-2">
            <Label>上传图片</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
              {/* 已上传图片预览 */}
              {previewUrls.map((url, index) => (
                <div key={index} className="relative aspect-square bg-muted rounded-md overflow-hidden">
                  <img 
                    src={url}
                    alt={`上传图片 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button 
                    className="absolute top-1 right-1 bg-black/60 p-1 rounded-full"
                    onClick={() => removeImage(index)}
                    type="button"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
              
              {/* 上传按钮 */}
              {previewUrls.length < 5 && (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-md flex flex-col items-center justify-center aspect-square hover:border-primary/50 transition-colors">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    multiple
                    onChange={handleImageChange}
                  />
                  <Label 
                    htmlFor="image-upload" 
                    className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                  >
                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                    <span className="text-xs text-center text-muted-foreground">
                      点击上传
                    </span>
                    <span className="text-xs text-center text-muted-foreground">
                      {previewUrls.length > 0 ? `${previewUrls.length}/5` : '最多5张'}
                    </span>
                  </Label>
                </div>
              )}
            </div>
            
            <div className="flex items-start mt-2">
              <Info className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                请上传清晰的料理成品照片，可以包括制作过程。支持JPG、PNG格式，每张不超过5MB。
              </p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button
            variant="outline"
            className="mr-2"
            onClick={() => navigate(`/task/detail/${id}`)}
          >
            取消
          </Button>
          <Button
            onClick={submitResult}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                提交作品
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 