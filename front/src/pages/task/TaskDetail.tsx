import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Trophy, 
  Users, 
  Calendar, 
  ShoppingBag, 
  Utensils, 
  Check, 
  Clock, 
  CircleDashed,
  Image,
  ChevronRight,
  ArrowLeft,
  Home,
  ChevronRight as ChevronRightIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { API_URLS } from '@/conf/env'
import { ScrollArea } from '@/components/ui/scroll-area'
import { mockTaskDetail, mockSubmissions, TaskSubmission, TaskStep } from '@/lib/task-mock'
import type { TaskDetail } from '@/lib/task-mock'
import TaskUserSubmit from './TaskUserSubmit'

export default function TaskDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // 状态
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 获取挑战详情
  useEffect(() => {
    const fetchTaskDetail = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 真实API调用
        if (process.env.NODE_ENV === 'production') {
          const response = await fetch(API_URLS.TASK.DETAIL(id || ''));
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setTaskDetail(data);
          
          // 获取任务内容（提交结果）
          const contentsResponse = await fetch(API_URLS.TASK.CONTENTS(id || ''));
          if (contentsResponse.ok) {
            const contentsData = await contentsResponse.json();
            setSubmissions(contentsData);
          }
        } else {
          // Mock数据
          setTimeout(() => {
            setTaskDetail(mockTaskDetail);
            setSubmissions(mockSubmissions);
          }, 0);
        }
      } catch (err) {
        console.error('Failed to fetch task details:', err);
        setError('获取挑战详情失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTaskDetail();
  }, [id]);
  
  // 加入挑战
  const joinTask = async () => {
    try {
      // 真实API调用
      if (process.env.NODE_ENV === 'production') {
        const response = await fetch(API_URLS.TASK.UPDATE_STATUS(id || ''), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'in_progress' })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // 更新本地状态
        setTaskDetail(prev => prev ? { ...prev, status: 'in_progress' } : null);
      } else {
        // Mock数据
        setTimeout(() => {
          setTaskDetail(prev => prev ? { ...prev, status: 'in_progress' } : null);
        }, 300);
      }
    } catch (err) {
      console.error('Failed to join task:', err);
      setError('加入挑战失败，请稍后再试');
    }
  };
  
  // 购买相关盲盒
  const purchaseBlindBox = () => {
    navigate('/blindbox/detail/summer-special'); // 导航到盲盒详情页
  };
  
  // 提交挑战结果
  const submitTaskResult = () => {
    navigate(`/task/submit/${id}`); // 导航到提交页面
  };
  
  // 处理步骤点击
  const handleStepAction = (step: TaskStep) => {
    if (step.type === 'purchase') {
      purchaseBlindBox();
    } else if (step.type === 'submit') {
      submitTaskResult();
    }
  };
  
  // 获取难度标签
  const getDifficultyLabel = (difficulty: string) => {
    switch(difficulty) {
      case 'easy': return t('dashboard.tasks.difficulty-easy');
      case 'medium': return t('dashboard.tasks.difficulty-medium');
      case 'hard': return t('dashboard.tasks.difficulty-hard');
      default: return t('dashboard.tasks.difficulty-all');
    }
  };

  // 获取难度颜色
  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return '';
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
  
  // 返回到挑战列表页面
  const goBackToExplore = () => {
    navigate('/task/explore');
  };
  
  // 返回按钮组件
  const BackButton = () => (
    <div className="mb-4">
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center text-muted-foreground hover:text-foreground"
        onClick={goBackToExplore}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        返回挑战列表
      </Button>
    </div>
  );
  
  // 面包屑导航组件
  const Breadcrumbs = ({ title }: { title: string }) => (
    <nav className="flex mb-4 text-sm items-center">
      <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => navigate('/')}>
        <Home className="h-3.5 w-3.5 mr-1" />
        <span>首页</span>
      </Button>
      <ChevronRightIcon className="h-3 w-3 mx-2 text-muted-foreground" />
      <Button variant="link" size="sm" className="p-0 h-auto" onClick={goBackToExplore}>
        <span>挑战列表</span>
      </Button>
      <ChevronRightIcon className="h-3 w-3 mx-2 text-muted-foreground" />
      <span className="text-muted-foreground truncate" title={title}>
        {title}
      </span>
    </nav>
  );
  
  // 添加错误处理函数
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.onerror = null; // 防止循环加载
    target.src = '/images/placeholder.jpg';
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <BackButton />
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
      <Breadcrumbs title={taskDetail.title} />
      
      {/* 挑战头部信息 */}
      <div className="mb-8 flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-2/3">
          <div className="relative h-64 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10" />
            <div className="absolute top-4 left-4 z-20">
              <Badge className={getDifficultyColor(taskDetail.difficulty)}>
                {getDifficultyLabel(taskDetail.difficulty)}
              </Badge>
            </div>
            <img 
              src={taskDetail.image} 
              alt={taskDetail.title}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20 text-white">
              <h1 className="text-3xl font-bold mb-2">{taskDetail.title}</h1>
              <div className="flex flex-wrap gap-2 mb-3">
                {taskDetail.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-white/20 text-white">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{taskDetail.participants} 人参与</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>截止日期: {taskDetail.deadline}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-1/3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                奖励
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{taskDetail.rewards}</p>
              <p className="text-muted-foreground mt-2">
                完成所有挑战步骤即可获得奖励
              </p>
            </CardContent>
            <CardFooter className="flex flex-col">
              {taskDetail.status === 'not_started' ? (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={joinTask}
                >
                  <Utensils className="mr-2 h-4 w-4" />
                  参与挑战
                </Button>
              ) : taskDetail.status === 'in_progress' ? (
                <div className="space-y-3 w-full">
                  <div className="text-sm text-center text-muted-foreground mb-2">
                    您已加入此挑战，请完成以下步骤
                  </div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={purchaseBlindBox}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    购买盲盒
                  </Button>
                  <Button 
                    className="w-full"
                    onClick={submitTaskResult}
                  >
                    <Image className="mr-2 h-4 w-4" />
                    提交结果
                  </Button>
                </div>
              ) : (
                <div className="text-center p-3 bg-green-100 dark:bg-green-900 rounded-md w-full">
                  <Check className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <p className="font-medium text-green-700 dark:text-green-300">
                    您已完成此挑战
                  </p>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* 挑战详情和提交内容标签 */}
      <Tabs defaultValue="details" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="details">挑战详情</TabsTrigger>
          <TabsTrigger value="submissions">他人作品 ({submissions.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          {/* 挑战描述 */}
          <Card>
            <CardHeader>
              <CardTitle>挑战描述</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{taskDetail.description}</p>
            </CardContent>
          </Card>
          
          {/* 挑战步骤 */}
          <Card>
            <CardHeader>
              <CardTitle>挑战步骤</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {taskDetail.steps.map((step, index) => (
                <div key={step.id} className="relative">
                  <div className="flex">
                    <div className="mr-4 flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900">
                        {getStepStatusIcon(step.status)}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold mb-1">
                          {step.title}
                        </h3>
                        {step.type === 'purchase' || step.type === 'submit' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStepAction(step)}
                          >
                            {step.type === 'purchase' ? '购买盲盒' : '提交结果'}
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  
                  {/* 连接线 */}
                  {index < taskDetail.steps.length - 1 && (
                    <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border h-6"></div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="submissions">
          <TaskUserSubmit 
            submissions={submissions} 
            handleImageError={handleImageError}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}