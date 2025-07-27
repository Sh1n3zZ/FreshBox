import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Check, 
  Clock, 
  CircleDashed
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getTaskDetail } from '@/lib/task'
import TaskUserSubmit from './TaskUserSubmit'
import TaskDetailDescription from './TaskDetailDescription'
import TaskDetailSteps from './TaskDetailSteps'
import TaskDetailNav from './TaskDetailNav'
import TaskDetailHeaderInfoCard from './TaskDetailHeaderInfoCard'

// 定义后端返回的类型
interface TaskStep {
  id: string
  title: string
  description: string
  type: string
  status?: string
  order: number
}

interface TaskDetail {
  id: string
  title: string
  description: string
  difficulty?: string
  participants?: number
  deadline: string
  tags: string[]
  image?: string
  rewards?: string
  status?: string
  steps: TaskStep[]
}

export default function TaskDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'details';
  
  // 状态
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 获取挑战详情
  useEffect(() => {
    const fetchTaskDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getTaskDetail(id as string);
        setTaskDetail(data);
      } catch (err) {
        console.error('Failed to fetch task details:', err);
        setError('获取挑战详情失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };
    fetchTaskDetail();
  }, [id]);
  
  // 处理步骤点击
  const handleStepAction = (step: TaskStep) => {
    if (step.type === 'purchase') {
      navigate('/BlindBox'); // 导航到盲盒详情页
    } else if (step.type === 'submit') {
      navigate(`/task/detail/${id}?tab=submissions`);
    }
  };
  
  // 获取步骤状态图标
  const getStepStatusIcon = (status?: string) => {
    switch(status) {
      case 'completed': return <Check className="h-5 w-5 text-green-500" />;
      case 'in_progress': return <CircleDashed className="h-5 w-5 text-blue-500" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <TaskDetailNav title={''} />
        <div className="py-12 flex justify-center">
          <div className="animate-spin">
            <CircleDashed className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !taskDetail) {
    return (
      <div className="container mx-auto py-6">
        <TaskDetailNav title={''} />
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
      <TaskDetailNav title={taskDetail.title} />
      {/* 挑战头部信息 */}
      <TaskDetailHeaderInfoCard 
        taskDetail={taskDetail} 
        onStatusChange={(status) => setTaskDetail(prev => prev ? { ...prev, status } : null)}
      />
      {/* 挑战详情和提交内容标签 */}
      <Tabs value={tab} onValueChange={v => setSearchParams({ ...Object.fromEntries(searchParams.entries()), tab: v })} className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="details">挑战详情</TabsTrigger>
          <TabsTrigger value="submissions">他人作品</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-6">
          <TaskDetailDescription description={taskDetail.description} />
          <TaskDetailSteps 
            steps={taskDetail.steps} 
            handleStepAction={handleStepAction} 
            getStepStatusIcon={getStepStatusIcon} 
          />
        </TabsContent>
        <TabsContent value="submissions">
          <TaskUserSubmit 
            taskId={id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}