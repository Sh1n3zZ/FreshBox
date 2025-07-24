import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/lib/task'
import { GlobalTaskCover } from './GlobalTaskCover'

interface TaskPanelCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}

export function TaskPanelCard({ task, onEdit, onDelete }: TaskPanelCardProps) {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base font-semibold">
          <span>{task.title}</span>
          <Badge variant="secondary">{task.status}</Badge>
        </CardTitle>
      </CardHeader>
      {task.image && (
        <div className="px-4">
          <GlobalTaskCover cover={task.image} size="md" className="mx-auto max-w-[280px]" />
        </div>
      )}
      <CardContent className="text-sm text-muted-foreground whitespace-pre-line break-words line-clamp-3">
        {task.description}
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          截止: {new Date(task.deadline).toLocaleDateString()}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(task)}>
            编辑
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(task.id)}>
            删除
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
