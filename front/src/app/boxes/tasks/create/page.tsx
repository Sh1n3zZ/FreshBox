import { FC } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDemo } from '@/components/ui/date-picker';
import { ArrowLeftIcon } from 'lucide-react';

const CreateTaskPage: FC = () => {
  // 任务类型选项
  const taskTypes = [
    { value: 'recipe_challenge', label: '创意料理挑战' },
    { value: 'food_rescue', label: '食物拯救行动' },
    { value: 'community_sharing', label: '社区分享会' },
    { value: 'zero_waste', label: '零浪费挑战' },
    { value: 'education', label: '教育科普任务' },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/boxes/tasks" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          返回任务列表
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>创建新任务</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">任务标题</label>
                <Input
                  placeholder="输入任务标题"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">任务类型</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择任务类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">任务描述</label>
                <Textarea
                  placeholder="详细描述任务内容和要求"
                  className="min-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">截止日期</label>
                  <DatePickerDemo />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">奖励积分</label>
                  <Input
                    type="number"
                    placeholder="输入奖励积分"
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">任务里程碑</label>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder={`里程碑 ${i}`}
                        className="flex-1"
                      />
                      {i > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          type="button"
                          className="shrink-0"
                        >
                          -
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="mt-2"
                >
                  添加里程碑
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">任务资源</label>
                <Textarea
                  placeholder="输入任务相关资源链接，一行一个"
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Link href="/boxes/tasks">
                  <Button variant="outline">取消</Button>
                </Link>
                <Button type="submit">创建任务</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateTaskPage; 