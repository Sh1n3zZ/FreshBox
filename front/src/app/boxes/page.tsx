import { FC } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BoxIcon, TicketIcon, UsersIcon, LeafIcon } from 'lucide-react';

const BoxesPage: FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">盲盒市场</h1>
          <p className="text-muted-foreground mt-1">发现各种临期美食，以优惠价格购买并减少浪费</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/boxes/create">
            <Button>创建盲盒</Button>
          </Link>
          <Link href="/boxes/tasks">
            <Button variant="outline" className="flex items-center gap-2">
              <TicketIcon className="h-4 w-4" />
              社交任务
              <Badge variant="secondary" className="ml-1">New</Badge>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">临期食品盲盒</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <BoxIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">256</div>
                <div className="text-sm text-muted-foreground">可用盲盒</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/boxes/dashboard" className="w-full">
              <Button variant="outline" className="w-full">查看详情</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">社交任务</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <TicketIcon className="h-8 w-8 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">38</div>
                <div className="text-sm text-muted-foreground">进行中的任务</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/boxes/tasks" className="w-full">
              <Button variant="outline" className="w-full">参与任务</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">环保贡献</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <LeafIcon className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">120 kg</div>
                <div className="text-sm text-muted-foreground">已节约食物</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">查看详情</Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>社交任务推荐</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: '1',
                  title: '创意料理挑战',
                  type: 'recipe_challenge',
                  reward: 50,
                  participants: 28,
                },
                {
                  id: '2',
                  title: '社区食品分享活动',
                  type: 'community_sharing',
                  reward: 100,
                  participants: 15,
                },
                {
                  id: '3',
                  title: '零浪费厨房挑战',
                  type: 'zero_waste',
                  reward: 120,
                  participants: 42,
                },
              ].map((task) => (
                <div key={task.id} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <Badge variant="outline">{task.reward} 积分</Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <UsersIcon className="h-3 w-3 mr-1" />
                      {task.participants}
                    </div>
                  </div>
                  <h3 className="font-medium mb-2">{task.title}</h3>
                  <Link href={`/boxes/tasks/${task.id}`}>
                    <Button size="sm" variant="outline" className="w-full">
                      查看任务
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full text-center">
              <Link href="/boxes/tasks">
                <Button variant="link">查看所有社交任务</Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4">最新盲盒</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <Badge variant="outline" className="font-normal">
                  {i % 2 === 0 ? '蔬果类' : '熟食类'}
                </Badge>
                <Badge variant="secondary" className="font-normal">
                  {Math.floor(Math.random() * 50 + 50)}% OFF
                </Badge>
              </div>
              <CardTitle className="mt-2">
                {i % 2 === 0 ? '新鲜蔬果盲盒' : '精选熟食盲盒'} #{i}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {i % 2 === 0
                  ? '包含各种临期新鲜蔬果，营养丰富，适合烹饪或直接食用。'
                  : '包含各种临期熟食，美味可口，加热即可食用。'}
              </p>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-bold">¥{Math.floor(Math.random() * 20 + 10)}</span>
                  <span className="text-muted-foreground line-through ml-2">
                    ¥{Math.floor(Math.random() * 30 + 30)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  剩余: {Math.floor(Math.random() * 10 + 1)}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/boxes/${i}`} className="w-full">
                <Button className="w-full">查看详情</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BoxesPage;
