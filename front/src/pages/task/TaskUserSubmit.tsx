import { Image } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { getTaskSubmissions } from '@/lib/task'
import TaskUserSubmitContent from './TaskUserSubmitContent'
import TaskUserSubmitCard from './TaskUserSubmitCard'

interface TaskUserSubmitProps {
  taskId?: string;
}

export default function TaskUserSubmit({ taskId }: TaskUserSubmitProps) {
  const [realSubmissions, setRealSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!taskId) return
    setLoading(true)
    getTaskSubmissions(taskId)
      .then(data => setRealSubmissions(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [taskId])

  // 只用真实后端数据
  const allSubmissions = realSubmissions

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">加载中...</div>
  }
  if (error) {
    return <div className="py-8 text-center text-red-500">{error}</div>
  }

  return (
    <>
      {/* 提交作品表单入口，可根据业务逻辑决定是否显示 */}
      <div className="mb-8">
        <TaskUserSubmitContent onSuccess={() => window.location.reload()} />
      </div>
      {Array.isArray(allSubmissions) && allSubmissions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allSubmissions.map((submission: any) => (
            <TaskUserSubmitCard
              key={submission.id}
              submission={submission}
              taskId={taskId}
              onCommentCountChange={(submissionId: string, count: number) => {
                // 更新本地评论数量
                setRealSubmissions(prev => 
                  prev.map((item: any) => 
                    item.id === submissionId 
                      ? { ...item, comments: count }
                      : item
                  )
                )
              }}
            />
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
    </>
  )
}
