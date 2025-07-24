import { useState } from 'react'
import { Send, X, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { createComment } from '@/lib/task'
import { useAuth } from '@/providers/auth-provider'

interface TaskUserCommentSubmitProps {
  taskId: string;
  submissionId: string;
  onCommentSuccess?: (newComment: any) => void;
}

export default function TaskUserCommentSubmit({ 
  taskId, 
  submissionId, 
  onCommentSuccess 
}: TaskUserCommentSubmitProps) {
  const { user } = useAuth()
  const [showCommentBox, setShowCommentBox] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 提交评论
  const handleSubmitComment = async () => {
    if (!commentContent.trim() || !user) return
    
    setSubmitting(true)
    try {
      const newComment = await createComment(taskId, submissionId, commentContent.trim())
      onCommentSuccess?.(newComment)
      setCommentContent('')
      setShowCommentBox(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交评论失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 w-full">
      {/* 评论按钮 */}
      <div className="flex items-center w-full">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowCommentBox(!showCommentBox)}
          className="flex items-center gap-2 w-full justify-center"
        >
          <div className="flex items-center justify-center">
            <MessageCircle className="h-4 w-4 mr-1" />
            <span>发表评论</span>
          </div>
        </Button>
      </div>

      {/* 评论框 */}
      {showCommentBox && (
        <Card className="w-full">
          <CardContent className="pt-4">
            <Textarea
              placeholder="写下你的评论..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="mb-3 w-full"
              rows={3}
            />
            <div className="flex gap-2 w-full">
              <Button 
                onClick={handleSubmitComment}
                disabled={submitting || !commentContent.trim() || !user}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-1" />
                发表评论
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setShowCommentBox(false)
                  setCommentContent('')
                }}
              >
                <X className="h-4 w-4 mr-1" />
                取消
              </Button>
            </div>
            {!user && (
              <p className="text-sm text-muted-foreground mt-2">
                请先登录后再发表评论
              </p>
            )}
            {error && (
              <p className="text-sm text-red-500 mt-2">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
