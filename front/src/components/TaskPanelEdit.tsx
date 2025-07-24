import React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { format, isBefore, startOfToday, endOfDay, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { createTask, updateTask, Task } from '@/lib/task'
import { TaskPanelCreateCoverUpload } from './TaskPanelCreateCoverUpload'
import { GlobalTaskCover } from './GlobalTaskCover'
import { TaskPanelEditTags } from './TaskPanelEditTags'

interface TaskPanelCreateProps {
  task?: Task | null
  onCreated?: (task: Task) => void
  onUpdated?: () => void
  onClose?: () => void
  trigger?: React.ReactNode
}

export function TaskPanelCreate({ 
  task, 
  onCreated, 
  onUpdated,
  onClose,
  trigger 
}: TaskPanelCreateProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [date, setDate] = React.useState<Date>()
  const today = startOfToday()

  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    image: '',
    deadline: '',
    reward: 0,
    tags: [] as string[],
  })

  // 当编辑模式下，task 发生变化时更新表单数据
  React.useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        image: task.image || '',
        deadline: task.deadline || '',
        reward: task.reward ? (typeof task.reward === 'string' ? parseFloat(task.reward) : task.reward) : 0,
        tags: task.tags ? JSON.parse(task.tags) : [],
      })
      // 如果有截止日期，设置日期选择器的值
      if (task.deadline) {
        setDate(parseISO(task.deadline))
      }
    }
  }, [task])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'reward' ? parseFloat(value) || 0 : value 
    }))
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && isBefore(selectedDate, today)) {
      toast.error('不能选择过去的日期')
      return
    }
    setDate(selectedDate)
    if (selectedDate) {
      const endOfSelectedDay = endOfDay(selectedDate)
      setFormData(prev => ({ 
        ...prev, 
        deadline: endOfSelectedDay.toISOString()
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('任务标题不能为空')
      return
    }
    if (!formData.description.trim()) {
      toast.error('任务描述不能为空')
      return
    }
    if (!formData.deadline) {
      toast.error('请选择截止日期')
      return
    }
    if (!formData.image) {
      toast.error('请上传封面图')
      return
    }

    const taskData = {
      ...formData,
      reward: Number(formData.reward) || 0,
      tags: JSON.stringify(formData.tags), // 以 JSON 数组字符串形式传递
    }

    setLoading(true)
    try {
      if (task) {
        // 编辑模式
        await updateTask(task.id, taskData)
        toast.success('任务更新成功')
        onUpdated?.()
      } else {
        // 创建模式
        const newTask = await createTask(taskData)
        toast.success('任务创建成功')
        onCreated?.(newTask)
      }
      handleClose()
    } catch (error) {
      toast.error(task ? '任务更新失败' : '任务创建失败')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      setOpen(false)
    }
    // 只在非编辑模式下重置表单
    if (!task) {
      setFormData({
        title: '',
        description: '',
        image: '',
        deadline: '',
        reward: 0,
        tags: [],
      })
      setDate(undefined)
    }
  }

  const dialogOpen = onClose ? !!task : open

  return (
    <Dialog open={dialogOpen} onOpenChange={handleClose}>
      {!task && (trigger || (
        <DialogTrigger asChild>
          <Button size="sm">新建任务</Button>
        </DialogTrigger>
      ))}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? '编辑任务' : '新建任务'}</DialogTitle>
          <DialogDescription>{task ? '修改任务信息。' : '创建一个新的挑战任务。'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-3 py-3">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">标题 *</Label>
            <Input id="title" name="title" value={formData.title} onChange={handleChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">描述 *</Label>
            <Textarea 
              id="description" 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              className="col-span-3" 
              rows={2}
              placeholder="请输入任务描述"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">封面图 *</Label>
            <div className="col-span-3 space-y-2">
              <GlobalTaskCover cover={formData.image} size="sm" />
              <div className="flex justify-end">
                <TaskPanelCreateCoverUpload
                  value={formData.image}
                  onChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deadline" className="text-right">截止日期 *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'col-span-3 justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'yyyy年MM月dd日') : <span>选择日期</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                  disabled={(date) => isBefore(date, today)}
                  modifiers={{
                    future: (date) => !isBefore(date, today),
                  }}
                  modifiersStyles={{
                    future: {
                      color: 'var(--primary)',
                    },
                    disabled: {
                      color: 'var(--muted-foreground)',
                      textDecoration: 'line-through',
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reward" className="text-right">奖励</Label>
            <Input 
              type="number" 
              id="reward" 
              name="reward" 
              value={formData.reward} 
              onChange={handleChange} 
              className="col-span-3"
              min="0"
              step="0.01"
              placeholder="请输入奖励金额"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">标签</Label>
            <div className="col-span-3 -mt-1">
              <TaskPanelEditTags
                tags={formData.tags}
                onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? (task ? '更新中...' : '创建中...') : (task ? '保存' : '创建')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
