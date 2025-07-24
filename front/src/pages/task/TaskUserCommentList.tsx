import { useState } from 'react'
import { 
  MessageCircle, 
  ThumbsUp, 
  Reply, 
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  deleteComment, 
  likeComment, 
  unlikeComment,
  createComment,
  type TaskComment 
} from '@/lib/task'
import { useAuth } from '@/providers/auth-provider'
import { GlobalAvatar } from '@/components/GlobalAvatar'

interface TaskUserCommentListProps {
  comments: TaskComment[];
  taskId: string;
  submissionId: string;
  onCommentCountChange?: (count: number) => void;
  loading?: boolean;
}

export default function TaskUserCommentList({ 
  comments, 
  taskId, 
  submissionId,
  onCommentCountChange,
  loading = false
}: TaskUserCommentListProps) {
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())

  // 提交回复
  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !user) return
    
    setSubmitting(true)
    try {
      const newReply = await createComment(taskId, submissionId, replyContent.trim(), parentId)
      onCommentCountChange?.(comments.length + 1)
      setReplyContent('')
      setReplyingTo(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交回复失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 删除评论
  const handleDeleteComment = async (commentId: string) => {
    if (!user) return
    
    try {
      await deleteComment(taskId, submissionId, commentId)
      onCommentCountChange?.(comments.length - 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除评论失败')
    }
  }

  // 点赞/取消点赞评论
  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!user) return
    
    try {
      if (isLiked) {
        await unlikeComment(taskId, submissionId, commentId)
      } else {
        await likeComment(taskId, submissionId, commentId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    }
  }

  // 切换评论展开状态
  const toggleCommentExpanded = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  // 评论组件
  const CommentItem = ({ comment, isReply = false }: { comment: TaskComment; isReply?: boolean }) => {
    const isExpanded = expandedComments.has(comment.id)
    const canDelete = user && comment.user_id === user.user_id

    return (
      <div className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="flex items-start gap-3 py-3">
          <GlobalAvatar 
            user={{ 
              avatar: comment.avatar, 
              username: comment.username 
            }} 
            size="sm"
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{comment.username}</span>
              <span className="text-xs text-muted-foreground">{comment.created_at}</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={() => handleLikeComment(comment.id, false)}
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                {comment.likes}
              </Button>
              {!isReply && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => setReplyingTo(comment.id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  回复
                </Button>
              )}
              {canDelete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs text-red-500 hover:text-red-700"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  删除
                </Button>
              )}
            </div>
            
            {/* 回复框 */}
            {replyingTo === comment.id && (
              <div className="mt-3">
                <Textarea
                  placeholder="写下你的回复..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="mb-2"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={submitting || !replyContent.trim()}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    回复
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyContent('')
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    取消
                  </Button>
                </div>
              </div>
            )}

            {/* 回复列表 */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => toggleCommentExpanded(comment.id)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      收起回复
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      查看回复 ({comment.replies.length})
                    </>
                  )}
                </Button>
                
                {isExpanded && (
                  <div className="mt-2 space-y-2">
                    {comment.replies.map(reply => (
                      <CommentItem key={reply.id} comment={reply} isReply />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        加载评论中...
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>暂无评论，快来发表第一条评论吧！</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 错误提示 */}
      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* 评论列表 */}
      <div className="space-y-2">
        {comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  )
}
