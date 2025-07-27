import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { 
  Trophy, 
  Users, 
  Calendar, 
  ShoppingBag, 
  Utensils, 
  Check, 
  Clock, 
  CircleDashed,
  Image,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { GlobalTaskCover } from '@/components/GlobalTaskCover'
import { 
  getTaskOverallProgress, 
  joinTask as joinTaskApi,
  TaskStepProgress,
  TaskStep
} from '@/lib/task'
import { toast } from 'sonner'

interface TaskDetailHeaderInfoCardProps {
  taskDetail: {
    id: string
    title: string
    description: string
    difficulty?: string
    participants?: number
    deadline: string
    tags: string[]
    image?: string
    rewards?: string
    status?: string
    steps: Array<{
      id: string
      title: string
      description: string
      type: string
      status?: string
      order: number
    }>
  }
  onStatusChange?: (status: string) => void
}

export default function TaskDetailHeaderInfoCard({ 
  taskDetail, 
  onStatusChange 
}: TaskDetailHeaderInfoCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  // 状态
  const [overallProgress, setOverallProgress] = useState<{
    total_steps: number
    completed_steps: number
    in_progress_steps: number
    not_started_steps: number
    average_progress: number
    steps: TaskStep[]
    progress_list: TaskStepProgress[]
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [progressLoading, setProgressLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取任务整体进度
  useEffect(() => {
    const fetchOverallProgress = async () => {
      setProgressLoading(true)
      setError(null)
      try {
        const data = await getTaskOverallProgress(taskDetail.id)
        setOverallProgress(data)
      } catch (err) {
        console.error('Failed to fetch overall progress:', err)
        setError('获取进度信息失败')
      } finally {
        setProgressLoading(false)
      }
    }

    // 只有当任务状态为进行中或已完成时才获取进度
    if (taskDetail.status === 'in_progress' || taskDetail.status === 'completed') {
      fetchOverallProgress()
    } else {
      setProgressLoading(false)
    }
  }, [taskDetail.id, taskDetail.status])

  // 加入挑战
  const joinTask = async () => {
    if (!taskDetail.id) return
    
    setLoading(true)
    try {
      await joinTaskApi(taskDetail.id)
      onStatusChange?.('in_progress')
      toast.success('成功加入挑战！')
    } catch (err) {
      console.error('Failed to join task:', err)
      toast.error('加入挑战失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  // 购买相关盲盒
  const purchaseBlindBox = () => {
    navigate('/BlindBox')
  }

  // 提交挑战结果
  const submitTaskResult = () => {
    navigate(`/task/detail/${taskDetail.id}?tab=submissions`)
  }

  // 获取难度标签
  const getDifficultyLabel = (difficulty?: string) => {
    switch(difficulty) {
      case 'easy': return t('dashboard.tasks.difficulty-easy')
      case 'medium': return t('dashboard.tasks.difficulty-medium')
      case 'hard': return t('dashboard.tasks.difficulty-hard')
      default: return t('dashboard.tasks.difficulty-all')
    }
  }

  // 获取难度颜色
  const getDifficultyColor = (difficulty?: string) => {
    switch(difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return ''
    }
  }

  // 判断挑战是否完成
  const isTaskCompleted = () => {
    if (!overallProgress) return false
    return overallProgress.completed_steps === overallProgress.total_steps && overallProgress.total_steps > 0
  }

  // 获取进度百分比
  const getProgressPercentage = () => {
    if (!overallProgress || overallProgress.total_steps === 0) return 0
    return Math.round((overallProgress.completed_steps / overallProgress.total_steps) * 100)
  }

  // 获取挑战状态
  const getTaskStatus = () => {
    if (taskDetail.status === 'completed' || isTaskCompleted()) {
      return 'completed'
    } else if (taskDetail.status === 'in_progress') {
      return 'in_progress'
    } else {
      return 'not_started'
    }
  }

  const taskStatus = getTaskStatus()

  return (
    <div className="mb-8 flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-2/3">
        <div className="relative h-64 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10" />
          <div className="absolute top-4 left-4 z-20">
            <Badge className={getDifficultyColor(taskDetail.difficulty)}>
              {getDifficultyLabel(taskDetail.difficulty)}
            </Badge>
          </div>
          <GlobalTaskCover cover={taskDetail.image} size="lg" alt={taskDetail.title} />
          <div className="absolute bottom-0 left-0 right-0 p-4 z-20 text-white">
            <h1 className="text-3xl font-bold mb-2">{taskDetail.title}</h1>
            <div className="flex flex-wrap gap-2 mb-3">
              {(Array.isArray(taskDetail.tags) ? taskDetail.tags : []).map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs bg-white/20 text-white">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{taskDetail.participants || 0} 人参与</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>截止日期: {taskDetail.deadline}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full md:w-1/3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
              奖励
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{taskDetail.rewards}</p>
            <p className="text-muted-foreground mt-2">
              完成所有挑战步骤即可获得奖励
            </p>
            
            {/* 进度显示 */}
            {taskStatus === 'in_progress' && overallProgress && (
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>完成进度</span>
                  <span>{getProgressPercentage()}%</span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {overallProgress.completed_steps} / {overallProgress.total_steps} 步骤已完成
                </div>
              </div>
            )}
            
            {taskStatus === 'completed' && (
              <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-md">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-green-700 dark:text-green-300 font-medium">
                    挑战已完成！
                  </span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col">
            {taskStatus === 'not_started' ? (
              <Button 
                className="w-full" 
                size="lg"
                onClick={joinTask}
                disabled={loading}
              >
                {loading ? (
                  <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Utensils className="mr-2 h-4 w-4" />
                )}
                {loading ? '加入中...' : '参与挑战'}
              </Button>
            ) : taskStatus === 'in_progress' ? (
              <div className="space-y-3 w-full">
                <div className="text-sm text-center text-muted-foreground mb-2">
                  您已加入此挑战，请完成以下步骤
                </div>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={purchaseBlindBox}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  购买盲盒
                </Button>
                <Button 
                  className="w-full"
                  onClick={submitTaskResult}
                >
                  <Image className="mr-2 h-4 w-4" />
                  提交结果
                </Button>
              </div>
            ) : taskStatus === 'completed' ? (
              <div className="text-center p-3 bg-green-100 dark:bg-green-900 rounded-md w-full">
                <Check className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <p className="font-medium text-green-700 dark:text-green-300">
                  您已完成此挑战
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  恭喜获得奖励！
                </p>
              </div>
            ) : null}
            
            {error && (
              <div className="mt-3 p-2 bg-red-100 dark:bg-red-900 rounded-md">
                <div className="flex items-center text-red-700 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span className="text-xs">{error}</span>
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
