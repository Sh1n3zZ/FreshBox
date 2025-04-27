import { useEffect, useState } from 'react'
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
  ThumbsUp,
  MessageCircle,
  ArrowLeft,
  Home,
  ChevronRight as ChevronRightIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getImageUrl } from '@/conf/env'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar } from '@/components/ui/avatar'
import { apiService } from '@/lib/api'

// API响应接口
interface ApiResponse {
  data: TaskDetail;
  msg: string;
  trace_id: string;
}

// 内容响应接口
interface ContentsResponse {
  data: TaskSubmission[];
  msg: string;
  trace_id: string;
}

// 挑战详情接口
interface TaskDetail {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'ongoing' | 'completed';
  created_at: string;
  deadline: string;
  reward: number;
  steps?: TaskStep[];
}

// 挑战步骤接口
interface TaskStep {
  id: number;
  title: string;
  description: string;
  type: string;
  status?: string;
}

// 挑战结果接口
interface TaskSubmission {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  title: string;
  description: string;
  images?: string[];
  likes: number;
  comments: number;
  createdAt: string;
}

// Mock数据
const mockTaskDetail = {
  id: '1',
  user_id: "mock-user-id",
  type: "recipe_challenge",
  title: "夏日清凉料理挑战",
  description: "使用盲盒食材制作清爽的夏日料理，赢取丰厚奖励",
  status: "pending",
  created_at: "2025-04-26T23:34:38.7470149+08:00",
  deadline: "2025-05-03T23:34:38.7470149+08:00",
  reward: 300,
  steps: [
    {
      id: 1,
      title: "购买夏日限定盲盒",
      description: "购买并开启一个夏日限定盲盒，使用里面的食材完成挑战",
      type: "purchase",
      status: "not_started"
    },
    {
      id: 2,
      title: "创作料理",
      description: "使用盲盒中的食材创作一道清爽的夏日料理",
      type: "create",
      status: "not_started"
    },
    {
      id: 3,
      title: "提交作品",
      description: "上传您的料理照片及制作过程",
      type: "submit",
      status: "not_started"
    }
  ]
};

const mockSubmissions: TaskSubmission[] = [
  {
    id: '1',
    userId: 'user1',
    username: 'SkyFrost',
    avatar: '/images/zjh.jpg',
    title: '薄荷柠檬凉拌蔬菜',
    description: '使用盲盒中的小黄瓜、胡萝卜和薄荷叶，加入柠檬汁调味，清爽可口！',
    images: ['/images/bohe.jpg'],
    likes: 86,
    comments: 12,
    createdAt: '2025-01-14'
  },
  {
    id: '2',
    userId: 'user2',
    username: 'Sh1n3ZzxCSGO',
    avatar: '/images/jdh.jpg',
    title: '水果沙拉冰淇淋',
    description: '将盲盒中的水果制成沙拉，搭配自制的酸奶冰淇淋，既健康又美味！',
    images: ['/images/saladicecream.jpg'],
    likes: 74,
    comments: 8,
    createdAt: '2023-11-18'
  },
  {
    id: '3',
    userId: 'user3',
    username: 'JimJiangOP',
    avatar: '/images/jim.jpg',
    title: '凉拌豆腐沙拉',
    description: '用盲盒中的豆腐、黄瓜和胡萝卜，加入特制酱汁，制作了一道低卡路里的夏日沙拉',
    images: ['/images/tofu.jpg'],
    likes: 62,
    comments: 15,
    createdAt: '2024-05-14'
  }
];

export default function TaskDetail() {
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
        // 使用apiService获取任务详情
        const response = await apiService.get<ApiResponse>(`/tasks/${id}`);
        if (response && response.data) {
          // 如果没有步骤信息，添加默认步骤
          const taskData = response.data;
          if (!taskData.steps) {
            taskData.steps = [
              {
                id: 1,
                title: "了解任务",
                description: "仔细阅读任务要求和奖励信息",
                type: "info",
                status: "pending"
              },
              {
                id: 2,
                title: "参与挑战",
                description: "根据任务类型完成相应挑战",
                type: "action",
                status: "pending"
              },
              {
                id: 3,
                title: "提交结果",
                description: "上传您的挑战成果",
                type: "submit",
                status: "pending"
              }
            ];
          }
          
          setTaskDetail(taskData);
          
          // 获取任务内容（提交结果）
          const contentsResponse = await apiService.get<ContentsResponse>(`/tasks/${id}/contents`);
          if (contentsResponse && contentsResponse.data) {
            setSubmissions(contentsResponse.data);
          }
        } else {
          throw new Error('无效的API响应');
        }
      } catch (err) {
        console.error('获取挑战详情失败:', err);
        setError('获取挑战详情失败，请稍后再试');
        
        // 开发环境下使用mock数据
        if (import.meta.env.DEV) {
          // 将mock数据适配为新的数据结构
          const adaptedMockData: TaskDetail = {
            ...mockTaskDetail,
            user_id: "mock-user-id",
            type: "recipe_challenge",
            status: "pending",
            created_at: "2025-04-26T23:34:38.7470149+08:00",
            deadline: "2025-05-03T23:34:38.7470149+08:00",
            reward: 50
          };
          
          setTaskDetail(adaptedMockData);
          setSubmissions(mockSubmissions);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchTaskDetail();
  }, [id]);
  
  // 加入挑战
  const joinTask = async () => {
    try {
      await apiService.put(`/tasks/${id}/status`, { status: 'ongoing' });
      
      // 更新本地状态
      setTaskDetail(prev => prev ? { ...prev, status: 'ongoing' } : null);
    } catch (err) {
      console.error('加入挑战失败:', err);
      setError('加入挑战失败，请稍后再试');
    }
  };
  
  // 购买相关盲盒
  const purchaseBlindBox = () => {
    navigate(`/blind-boxes/${id}/purchase`); // 导航到盲盒详情页
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
  
  // 获取步骤状态图标
  const getStepStatusIcon = (status?: string) => {
    switch(status) {
      case 'completed': return <Check className="h-5 w-5 text-green-500" />;
      case 'in_progress': 
      case 'ongoing': return <CircleDashed className="h-5 w-5 text-blue-500" />;
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
    target.src = getImageUrl('/images/placeholder.jpg');
  };
  
  // 获取状态标签
  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending': return '待开始';
      case 'ongoing': return '进行中';
      case 'completed': return '已完成';
      default: return '未知状态';
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'ongoing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return '';
    }
  };
  
  // 获取任务类型标签
  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'recipe_challenge': return '料理挑战';
      case 'food_rescue': return '食物拯救';
      case 'community_sharing': return '社区分享';
      default: return type;
    }
  };
  
  // 获取任务图标
  const getTaskTypeIcon = (type: string) => {
    switch(type) {
      case 'recipe_challenge': return <Utensils className="h-5 w-5 text-primary" />;
      case 'food_rescue': return <ShoppingBag className="h-5 w-5 text-primary" />;
      case 'community_sharing': return <Users className="h-5 w-5 text-primary" />;
      default: return <Trophy className="h-5 w-5 text-primary" />;
    }
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
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40 z-10" />
            <div className="absolute top-4 left-4 z-20">
              <Badge className={getStatusColor(taskDetail.status)}>
                {getStatusLabel(taskDetail.status)}
              </Badge>
            </div>
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-center">
                {getTaskTypeIcon(taskDetail.type)}
                <h1 className="text-3xl font-bold mt-4">{taskDetail.title}</h1>
                <Badge variant="outline" className="mt-2">
                  {getTypeLabel(taskDetail.type)}
                </Badge>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
              <div className="flex items-center justify-between gap-4 text-slate-800">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>截止日期: {new Date(taskDetail.deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <Trophy className="h-4 w-4 mr-1" />
                  <span>奖励: {taskDetail.reward} 积分</span>
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
              <p className="text-lg font-semibold">{taskDetail.reward} 积分</p>
              <p className="text-muted-foreground mt-2">
                完成所有挑战步骤即可获得奖励
              </p>
            </CardContent>
            <CardFooter className="flex flex-col">
              {taskDetail.status === 'pending' ? (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={joinTask}
                >
                  <Utensils className="mr-2 h-4 w-4" />
                  参与挑战
                </Button>
              ) : taskDetail.status === 'ongoing' ? (
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
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    创建时间: {new Date(taskDetail.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    截止日期: {new Date(taskDetail.deadline).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 挑战步骤 */}
          <Card>
            <CardHeader>
              <CardTitle>挑战步骤</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {taskDetail.steps && taskDetail.steps.map((step, index) => (
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
                  {taskDetail.steps && index < taskDetail.steps.length - 1 && (
                    <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border h-6"></div>
                  )}
                </div>
              ))}
              
              {/* 如果没有步骤，显示提示信息 */}
              {(!taskDetail.steps || taskDetail.steps.length === 0) && (
                <div className="text-center py-6 text-muted-foreground">
                  暂无详细步骤信息，请按照挑战描述完成任务。
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="submissions">
          {/* 他人提交的作品 */}
          {submissions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {submissions.map((submission) => (
                <Card key={submission.id} className="overflow-hidden">
                  <div className="relative">
                    <ScrollArea className="h-64">
                      <div className="flex snap-x snap-mandatory overflow-x-auto">
                        {submission.images && submission.images.length > 0 ? (
                          submission.images.map((image, i) => (
                            <div key={i} className="snap-center shrink-0 w-full h-64">
                              <img 
                                src={getImageUrl(image)} 
                                alt={`${submission.title} - 图片 ${i+1}`}
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                              />
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-center w-full h-64 bg-muted">
                            <Image className="h-12 w-12 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    {submission.images && submission.images.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                        {submission.images.map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70"></div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="pt-4">
                    <div className="flex items-center mb-3">
                      <Avatar className="h-6 w-6 mr-2">
                        <img src={getImageUrl(submission.avatar)} alt={submission.username} />
                      </Avatar>
                      <span className="font-medium">{submission.username}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{submission.title}</h3>
                    <p className="text-muted-foreground text-sm">{submission.description}</p>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between border-t pt-4">
                    <div className="flex gap-4">
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        <span>{submission.likes}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        <span>{submission.comments}</span>
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {submission.createdAt}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 flex flex-col items-center justify-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">暂无提交作品</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  目前还没有人提交此挑战的作品，成为第一个完成挑战的人吧！
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}