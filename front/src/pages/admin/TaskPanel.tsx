import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Task, getTasks, deleteTask } from '@/lib/task'
import { TaskPanelCard } from '@/components/TaskPanelCard'
import { TaskPanelCreate } from '@/components/TaskPanelEdit'
import { FileQuestion } from 'lucide-react'

export default function TaskPanel() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const list = await getTasks()
      setTasks(list)
    } catch (error) {
      toast.error('获取任务列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async (taskId: string) => {
    if (!window.confirm('确定删除该任务吗？')) return
    try {
      await deleteTask(taskId)
      toast.success('删除成功')
      setTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleCreated = (task: Task) => {
    setTasks(prev => [task, ...prev])
  }

  const handleUpdated = () => {
    fetchData()
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">任务管理</h1>
        <TaskPanelCreate onCreated={handleCreated} />
      </div>

      {loading ? (
        <div className="text-center py-10">加载中...</div>
      ) : (
        tasks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tasks.map(task => (
              <TaskPanelCard key={task.id} task={task} onEdit={setSelectedTask} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FileQuestion className="h-12 w-12 mb-4" />
            <p>暂无任务数据</p>
            <p className="text-sm mt-2">点击右上角"新建任务"按钮创建第一个任务</p>
          </div>
        )
      )}

      {/* 编辑任务弹窗 */}
      {selectedTask && (
        <TaskPanelCreate task={selectedTask} onUpdated={handleUpdated} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  )
}
