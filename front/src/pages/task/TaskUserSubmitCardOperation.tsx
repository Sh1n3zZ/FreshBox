import { ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TaskUserComment from './TaskUserComment'

interface TaskUserSubmitCardOperationProps {
  likes: number;
  createdAt?: string;
  taskId?: string;
  submissionId: string;
  onCommentCountChange: (submissionId: string, count: number) => void;
}

export default function TaskUserSubmitCardOperation({ 
  likes, 
  createdAt,
  taskId,
  submissionId,
  onCommentCountChange
}: TaskUserSubmitCardOperationProps) {
  return (
    <div className="flex flex-col w-full">
      {/* 点赞和时间 */}
      <div className="flex items-center justify-between w-full py-2 border-b">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2 flex-1 justify-center"
        >
          <div className="flex items-center justify-center">
            <ThumbsUp className="h-4 w-4 mr-1" />
            <span>{likes}</span>
          </div>
        </Button>
        <div className="text-xs text-muted-foreground">
          {createdAt}
        </div>
      </div>

      {/* 评论组件 */}
      {taskId && (
        <div className="w-full pt-4">
          <TaskUserComment 
            taskId={taskId}
            submissionId={submissionId}
            onCommentCountChange={(count) => {
              onCommentCountChange(submissionId, count)
            }}
          />
        </div>
      )}
    </div>
  )
}
