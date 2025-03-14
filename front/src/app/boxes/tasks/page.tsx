import { FC } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskCard from './_components/TaskCard';

const TasksPage: FC = () => {
  // 模拟任务数据
  const allTasks = [
    {
      id: '1',
      title: '创意料理挑战',
      description: '使用盲盒食材制作一道创意料理，并分享照片和做法',
      type: 'recipe_challenge',
      status: 'ongoing',
      reward: 50,
      deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      progress: 65,
    },
    {
      id: '2',
      title: '食物拯救行动',
      description: '收集并分享5个减少食物浪费的实用技巧',
      type: 'food_rescue',
      status: 'pending',
      reward: 30,
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      progress: 0,
    },
    {
      id: '3',
      title: '社区分享会',
      description: '组织一次小型的临期食品分享活动，并记录过程',
      type: 'community_sharing',
      status: 'completed',
      reward: 100,
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      progress: 100,
    },
  ];

  const recommendedTasks = [
    {
      id: '4',
      title: '水果盲盒创意甜点',
      description: '使用水果盲盒制作创意甜点，拍照分享获得奖励',
      type: 'recipe_challenge',
      status: 'pending',
      reward: 80,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      progress: 0,
    },
    {
      id: '5',
      title: '零浪费厨房挑战',
      description: '连续7天实践零浪费烹饪，分享你的经验和技巧',
      type: 'zero_waste',
      status: 'pending',
      reward: 120,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      progress: 0,
    },
  ];

  const popularTasks = [
    {
      id: '6',
      title: '社区厨房大挑战',
      description: '组队参与，使用临期食材制作美食并评比',
      type: 'group_challenge',
      status: 'ongoing',
      reward: 200,
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      progress: 30,
    },
    {
      id: '7',
      title: '食品安全科普任务',
      description: '制作一份关于如何判断食品是否过期的科普内容',
      type: 'education',
      status: 'ongoing',
      reward: 60,
      deadline: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      progress: 45,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">社交任务</h1>
          <p className="text-muted-foreground mt-1">参与任务，获取奖励，共同减少食物浪费</p>
        </div>
        <Button>创建任务</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-4 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-primary">38</div>
          <div className="text-sm text-muted-foreground mt-1">进行中的任务</div>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-green-500">15</div>
          <div className="text-sm text-muted-foreground mt-1">已完成任务</div>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-amber-500">1250</div>
          <div className="text-sm text-muted-foreground mt-1">获得积分</div>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-blue-500">87</div>
          <div className="text-sm text-muted-foreground mt-1">社区排名</div>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">所有任务</TabsTrigger>
          <TabsTrigger value="recommended">推荐任务</TabsTrigger>
          <TabsTrigger value="popular">热门挑战</TabsTrigger>
          <TabsTrigger value="my">我的任务</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommended" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allTasks.filter(task => ['ongoing', 'completed'].includes(task.status)).map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TasksPage; 