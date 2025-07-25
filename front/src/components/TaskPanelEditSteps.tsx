import React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Circle, 
  Clock,
  AlertCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { 
  TaskStep, 
  getTaskSteps, 
  createTaskStep, 
  updateTaskStep, 
  deleteTaskStep, 
  reorderTaskSteps 
} from '@/lib/task'

interface TaskPanelEditStepsProps {
  taskId: string
  onStepsChange?: () => void
}

interface StepFormData {
  title: string
  description: string
  type: TaskStep['type']
  order: number
}

const stepTypeOptions = [
  { value: 'purchase', label: '购买', icon: '🛒' },
  { value: 'create', label: '制作', icon: '👨‍🍳' },
  { value: 'submit', label: '提交', icon: '📤' },
  { value: 'other', label: '其他', icon: '📝' },
]

const stepStatusConfig = {
  not_started: { label: '未开始', icon: Circle, color: 'bg-gray-100 text-gray-600' },
  in_progress: { label: '进行中', icon: Clock, color: 'bg-blue-100 text-blue-600' },
  completed: { label: '已完成', icon: CheckCircle, color: 'bg-green-100 text-green-600' },
}

export function TaskPanelEditSteps({ taskId, onStepsChange }: TaskPanelEditStepsProps) {
  const [steps, setSteps] = React.useState<TaskStep[]>([])
  const [loading, setLoading] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingStep, setEditingStep] = React.useState<TaskStep | null>(null)
  const [formData, setFormData] = React.useState<StepFormData>({
    title: '',
    description: '',
    type: 'other',
    order: 0,
  })

  // 加载任务步骤
  const loadSteps = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await getTaskSteps(taskId)
      setSteps(data.sort((a, b) => a.order - b.order))
    } catch (error) {
      toast.error('加载任务步骤失败')
    } finally {
      setLoading(false)
    }
  }, [taskId])

  React.useEffect(() => {
    loadSteps()
  }, [loadSteps])

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'other',
      order: 0,
    })
    setEditingStep(null)
  }

  // 打开创建对话框
  const handleCreate = () => {
    resetForm()
    setFormData(prev => ({ ...prev, order: steps.length + 1 }))
    setDialogOpen(true)
  }

  // 打开编辑对话框
  const handleEdit = (step: TaskStep) => {
    setEditingStep(step)
    setFormData({
      title: step.title,
      description: step.description,
      type: step.type,
      order: step.order,
    })
    setDialogOpen(true)
  }

  // 删除步骤
  const handleDelete = async (stepId: number) => {
    if (!confirm('确定要删除这个步骤吗？')) return

    try {
      await deleteTaskStep(taskId, stepId)
      toast.success('步骤删除成功')
      loadSteps()
      onStepsChange?.()
    } catch (error) {
      toast.error('步骤删除失败')
    }
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('步骤标题不能为空')
      return
    }

    try {
      if (editingStep) {
        // 编辑模式
        await updateTaskStep(taskId, editingStep.id, formData)
        toast.success('步骤更新成功')
      } else {
        // 创建模式
        await createTaskStep(taskId, formData)
        toast.success('步骤创建成功')
      }
      setDialogOpen(false)
      resetForm()
      loadSteps()
      onStepsChange?.()
    } catch (error) {
      toast.error(editingStep ? '步骤更新失败' : '步骤创建失败')
    }
  }

  // 移动步骤位置
  const moveStep = async (stepId: number, direction: 'up' | 'down') => {
    const currentIndex = steps.findIndex(step => step.id === stepId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= steps.length) return

    const items = Array.from(steps)
    const [movedItem] = items.splice(currentIndex, 1)
    items.splice(newIndex, 0, movedItem)

    // 更新本地状态
    setSteps(items.map((item, index) => ({ ...item, order: index + 1 })))

    // 构建新的顺序映射
    const stepOrders: Record<number, number> = {}
    items.forEach((item, index) => {
      stepOrders[item.id] = index + 1
    })

    try {
      await reorderTaskSteps(taskId, stepOrders)
      toast.success('步骤顺序更新成功')
      onStepsChange?.()
    } catch (error) {
      toast.error('步骤顺序更新失败')
      // 重新加载原始数据
      loadSteps()
    }
  }

  const getStepTypeLabel = (type: TaskStep['type']) => {
    return stepTypeOptions.find(option => option.value === type)?.label || '其他'
  }

  const getStepTypeIcon = (type: TaskStep['type']) => {
    return stepTypeOptions.find(option => option.value === type)?.icon || '📝'
  }

  const getStepStatusConfig = (status?: TaskStep['status']) => {
    if (!status) return stepStatusConfig.not_started
    return stepStatusConfig[status] || stepStatusConfig.not_started
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">任务步骤</h3>
        <Button onClick={handleCreate} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          添加步骤
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : steps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">暂无任务步骤</p>
            <Button onClick={handleCreate} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              添加第一个步骤
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {steps.map((step, index) => {
            const statusConfig = getStepStatusConfig(step.status)
            const StatusIcon = statusConfig.icon

            return (
              <Card key={step.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStep(step.id, 'up')}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStep(step.id, 'down')}
                        disabled={index === steps.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{step.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {getStepTypeIcon(step.type)} {getStepTypeLabel(step.type)}
                        </Badge>
                        <Badge className={`text-xs ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      {step.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {step.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(step)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(step.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 步骤编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingStep ? '编辑步骤' : '添加步骤'}
            </DialogTitle>
            <DialogDescription>
              {editingStep ? '修改步骤信息。' : '为任务添加一个新的步骤。'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">步骤标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入步骤标题"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">步骤描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入步骤描述（可选）"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">步骤类型 *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: TaskStep['type']) => 
                  setFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择步骤类型" />
                </SelectTrigger>
                <SelectContent>
                  {stepTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">步骤顺序</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                placeholder="步骤顺序"
                min="1"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">
                {editingStep ? '保存' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
