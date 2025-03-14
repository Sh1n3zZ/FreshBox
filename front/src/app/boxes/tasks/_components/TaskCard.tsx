import { FC } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarIcon, CoinsIcon } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  reward: number;
  deadline: Date;
  progress: number;
}

interface TaskCardProps {
  task: Task;
}

const TaskCard: FC<TaskCardProps> = ({ task }) => {
  // 获取任务类型标签颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'recipe_challenge':
        return 'bg-green-100 text-green-800';
      case 'food_rescue':
        return 'bg-blue-100 text-blue-800';
      case 'community_sharing':
        return 'bg-purple-100 text-purple-800';
      case 'zero_waste':
        return 'bg-teal-100 text-teal-800';
      case 'group_challenge':
        return 'bg-pink-100 text-pink-800';
      case 'education':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取任务类型显示名称
  const getTypeName = (type: string) => {
    switch (type) {
      case 'recipe_challenge':
        return '创意料理';
      case 'food_rescue':
        return '食物拯救';
      case 'community_sharing':
        return '社区分享';
      case 'zero_waste':
        return '零浪费';
      case 'group_challenge':
        return '团队挑战';
      case 'education':
        return '科普教育';
      default:
        return '其它';
    }
  };

  // 获取任务状态标签
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="ml-2">待开始</Badge>;
      case 'ongoing':
        return <Badge variant="secondary" className="ml-2">进行中</Badge>;
      case 'completed':
        return <Badge variant="default" className="ml-2">已完成</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="ml-2">已失败</Badge>;
      default:
        return null;
    }
  };

  // 格式化截止日期
  const formatDeadline = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge className={`${getTypeColor(task.type)} font-normal`}>
            {getTypeName(task.type)}
          </Badge>
          {getStatusBadge(task.status)}
        </div>
        <CardTitle className="mt-2">{task.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 line-clamp-2">{task.description}</p>
        
        {task.status !== 'pending' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>完成进度</span>
              <span>{task.progress}%</span>
            </div>
            <Progress value={task.progress} />
          </div>
        )}
        
        <div className="flex items-center text-sm text-muted-foreground mt-2">
          <CalendarIcon className="mr-1 h-4 w-4" />
          <span>截止日期: {formatDeadline(task.deadline)}</span>
        </div>
        
        <div className="flex items-center text-sm text-amber-600 mt-2">
          <CoinsIcon className="mr-1 h-4 w-4" />
          <span>奖励积分: {task.reward}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/boxes/tasks/${task.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            {task.status === 'pending' ? '开始任务' : 
             task.status === 'ongoing' ? '继续任务' : 
             task.status === 'completed' ? '查看详情' : '重新尝试'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default TaskCard; 