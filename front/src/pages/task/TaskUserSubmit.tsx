import { 
  ThumbsUp,
  MessageCircle,
  Image
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar } from '@/components/ui/avatar'
import { TaskSubmission } from '@/lib/task-mock'
import { useEffect, useState } from 'react'
import { getTaskSubmissions } from '@/lib/task'
import { mockSubmissions } from '@/lib/task-mock'

interface TaskUserSubmitProps {
  submissions: TaskSubmission[];
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  taskId?: string;
}

export default function TaskUserSubmit({ submissions, handleImageError, taskId }: TaskUserSubmitProps) {
  const [realSubmissions, setRealSubmissions] = useState<TaskSubmission[]>([])
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

  // 合并 mock 和真实数据（真实数据在前）
  const allSubmissions = [...realSubmissions, ...submissions]

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">加载中...</div>
  }
  if (error) {
    return <div className="py-8 text-center text-red-500">{error}</div>
  }

  return (
    <>
      {allSubmissions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allSubmissions.map((submission) => (
            <Card key={submission.id} className="overflow-hidden">
              <div className="relative">
                <ScrollArea className="h-64">
                  <div className="flex snap-x snap-mandatory overflow-x-auto">
                    {submission.images.map((image, i) => (
                      <div key={i} className="snap-center shrink-0 w-full h-64">
                        <img 
                          src={image} 
                          alt={`${submission.title} - 图片 ${i+1}`}
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {submission.images.length > 1 && (
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
                    <img src={submission.avatar} alt={submission.username} />
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
    </>
  )
}
