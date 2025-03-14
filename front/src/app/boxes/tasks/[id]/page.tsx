import { FC } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeftIcon, CalendarIcon, CoinsIcon, CheckCircleIcon, TimerIcon, PlusIcon, SendIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface TaskDetailPageProps {
  params: {
    id: string;
  };
}

const TaskDetailPage: FC<TaskDetailPageProps> = ({ params }) => {
  const { id } = params;

  // 模拟任务数据
  const task = {
    id: id,
    title: '创意料理挑战',
    description: '使用盲盒食材制作一道创意料理，并分享照片和做法。该任务旨在鼓励大家发挥创意，充分利用临期食材，减少食物浪费。完成任务后，您将获得社区积分奖励，并有机会在社区内展示您的作品。',
    type: 'recipe_challenge',
    status: 'ongoing',
    reward: 50,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    progress: 65,
    milestones: [
      { id: '1', title: '购买盲盒', completed: true, completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000) },
      { id: '2', title: '制作料理', completed: true, completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      { id: '3', title: '上传照片', completed: false },
      { id: '4', title: '分享社区', completed: false },
    ],
    contents: [
      {
        id: '1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe',
        metadata: {
          description: '使用盲盒中的食材制作的沙拉',
          tags: ['蔬菜沙拉', '创意料理', '盲盒挑战']
        },
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        id: '2',
        type: 'text',
        content: '今天使用了盲盒中的牛油果、西红柿和鸡蛋，做了一份健康早餐。牛油果还剩一半，计划明天做成沙拉。',
        metadata: {
          tags: ['经验分享', '食材规划']
        },
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000)
      }
    ],
    comments: [
      {
        id: '1',
        userId: 'user1',
        userName: '美食达人',
        avatar: 'https://i.pravatar.cc/150?img=1',
        content: '看起来太美味了！可以分享一下你的做法吗？',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        id: '2',
        userId: 'user2',
        userName: '绿色生活家',
        avatar: 'https://i.pravatar.cc/150?img=2',
        content: '很好的利用方式，减少浪费从我做起！',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ]
  };

  if (!task) {
    return notFound();
  }

  // 格式化日期
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 获取任务类型标签
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'recipe_challenge':
        return { label: '创意料理', color: 'bg-green-100 text-green-800' };
      case 'food_rescue':
        return { label: '食物拯救', color: 'bg-blue-100 text-blue-800' };
      case 'community_sharing':
        return { label: '社区分享', color: 'bg-purple-100 text-purple-800' };
      default:
        return { label: '其它任务', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const typeInfo = getTypeLabel(task.type);

  // 获取任务状态标签
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">待开始</Badge>;
      case 'ongoing':
        return <Badge variant="secondary">进行中</Badge>;
      case 'completed':
        return <Badge variant="default">已完成</Badge>;
      case 'failed':
        return <Badge variant="destructive">已失败</Badge>;
      default:
        return null;
    }
  };

  // 剩余时间计算
  const getRemainingTime = () => {
    const now = new Date();
    const diff = task.deadline.getTime() - now.getTime();
    
    if (diff <= 0) return '已截止';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}天${hours}小时`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/boxes/tasks" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          返回任务列表
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：任务详情 */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={`${typeInfo.color} font-normal`}>
                  {typeInfo.label}
                </Badge>
                {getStatusBadge(task.status)}
              </div>
              
              <h1 className="text-2xl font-bold mb-4">{task.title}</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-sm">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>截止日期: {formatDate(task.deadline)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <TimerIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>剩余时间: {getRemainingTime()}</span>
                </div>
                <div className="flex items-center text-sm">
                  <CoinsIcon className="mr-2 h-4 w-4 text-amber-500" />
                  <span className="text-amber-600">奖励积分: {task.reward}</span>
                </div>
                <div className="flex items-center text-sm">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>创建时间: {formatDate(task.createdAt)}</span>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-2">任务描述</h2>
                <p className="text-muted-foreground">{task.description}</p>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <h2 className="text-lg font-medium">完成进度</h2>
                  <span className="text-sm">{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="mb-4" />
                
                <div className="space-y-3">
                  {task.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center">
                      <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${milestone.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {milestone.completed ? (
                          <CheckCircleIcon className="h-5 w-5" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-current"></div>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between">
                          <span className={milestone.completed ? 'line-through text-muted-foreground' : ''}>
                            {milestone.title}
                          </span>
                          {milestone.completed && milestone.completedAt && (
                            <span className="text-xs text-muted-foreground">
                              {milestone.completedAt.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button disabled={task.status === 'completed'}>
                  {task.progress === 100 ? '完成任务' : '更新进度'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardContent className="pt-6">
              <Tabs defaultValue="content">
                <TabsList className="mb-4">
                  <TabsTrigger value="content">提交内容</TabsTrigger>
                  <TabsTrigger value="comments">评论 ({task.comments.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content">
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium">已提交内容</h2>
                      <Button size="sm" variant="outline" className="flex items-center">
                        <PlusIcon className="mr-1 h-4 w-4" />
                        添加内容
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {task.contents.map((content) => (
                        <div key={content.id} className="p-4 border rounded-lg">
                          {content.type === 'image' && (
                            <div>
                              <div className="relative h-40 mb-2 rounded-md overflow-hidden">
                                <Image
                                  src={content.url}
                                  alt={content.metadata?.description || '任务图片'}
                                  layout="fill"
                                  objectFit="cover"
                                />
                              </div>
                              <p className="text-sm">{content.metadata?.description}</p>
                            </div>
                          )}
                          
                          {content.type === 'text' && (
                            <div>
                              <p>{content.content}</p>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex gap-1">
                              {content.metadata?.tags && content.metadata.tags.map((tag: string, i: number) => (
                                <Badge key={i} variant="outline" className="mr-1">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {content.createdAt.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {task.contents.length === 0 && (
                        <div className="text-center p-4 text-muted-foreground">
                          尚未提交任何内容
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="comments">
                  <div className="mb-4">
                    <h2 className="text-lg font-medium mb-4">任务评论</h2>
                    
                    <div className="space-y-4 mb-4">
                      {task.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <Image
                              src={comment.avatar}
                              alt={comment.userName}
                              width={32}
                              height={32}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <p className="font-medium">{comment.userName}</p>
                              <span className="text-xs text-muted-foreground">
                                {comment.createdAt.toLocaleString()}
                              </span>
                            </div>
                            <p>{comment.content}</p>
                          </div>
                        </div>
                      ))}
                      
                      {task.comments.length === 0 && (
                        <div className="text-center p-4 text-muted-foreground">
                          暂无评论
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="添加评论..."
                        className="flex-1 px-3 py-2 border rounded-md"
                      />
                      <Button size="sm">
                        <SendIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* 右侧：推荐任务和任务资源 */}
        <div>
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-medium mb-4">推荐任务</h2>
              
              <div className="space-y-4">
                {[
                  {
                    id: '101',
                    title: '零浪费烹饪挑战',
                    type: 'zero_waste',
                    reward: 80,
                  },
                  {
                    id: '102',
                    title: '社区食品分享活动',
                    type: 'community_sharing',
                    reward: 100,
                  },
                ].map((rec) => (
                  <div key={rec.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium">{rec.title}</h3>
                      <Badge variant="outline" className="ml-2">
                        {rec.reward} 积分
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <Link href={`/boxes/tasks/${rec.id}`}>
                        <Button size="sm" variant="outline" className="w-full">查看任务</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardContent className="pt-6">
              <h2 className="text-lg font-medium mb-4">任务资源</h2>
              
              <div className="space-y-3">
                <Link href="#" className="block text-sm text-blue-600 hover:underline">
                  《食物回收利用指南》
                </Link>
                <Link href="#" className="block text-sm text-blue-600 hover:underline">
                  《如何判断食品是否过期》
                </Link>
                <Link href="#" className="block text-sm text-blue-600 hover:underline">
                  《创意料理 30 例》
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage; 