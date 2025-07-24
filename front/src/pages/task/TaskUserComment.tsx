import { useState, useEffect } from 'react'
import { getSubmissionComments, type TaskComment } from '@/lib/task'
import TaskUserCommentSubmit from './TaskUserCommentSubmit'
import TaskUserCommentList from './TaskUserCommentList'

interface TaskUserCommentProps {
  taskId: string;
  submissionId: string;
  onCommentCountChange?: (count: number) => void;
}

export default function TaskUserComment({ taskId, submissionId, onCommentCountChange }: TaskUserCommentProps) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取评论列表
  const fetchComments = async () => {
    if (!taskId || !submissionId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await getSubmissionComments(taskId, submissionId)
      setComments(data)
      onCommentCountChange?.(data.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取评论失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [taskId, submissionId])

  // 处理新评论提交成功
  const handleCommentSuccess = (newComment: TaskComment) => {
    setComments(prev => [newComment, ...prev])
    onCommentCountChange?.(comments.length + 1)
  }

  return (
    <div className="space-y-4">
      {/* 评论提交组件 */}
      <TaskUserCommentSubmit 
        taskId={taskId}
        submissionId={submissionId}
        onCommentSuccess={handleCommentSuccess}
      />

      {/* 评论列表组件 */}
      <TaskUserCommentList 
        comments={comments}
        taskId={taskId}
        submissionId={submissionId}
        onCommentCountChange={onCommentCountChange}
        loading={loading}
      />

      {/* 错误提示 */}
      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}
    </div>
  )
}
