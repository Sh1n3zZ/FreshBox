import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GlobalAvatar } from '@/components/GlobalAvatar'
import { GlobalTaskCover } from '@/components/GlobalTaskCover'
import TaskUserSubmitCardOperation from './TaskUserSubmitCardOperation'

interface TaskUserSubmitCardProps {
  submission: any;
  taskId?: string;
  onCommentCountChange: (submissionId: string, count: number) => void;
}

export default function TaskUserSubmitCard({ 
  submission, 
  taskId,
  onCommentCountChange 
}: TaskUserSubmitCardProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative">
        <ScrollArea className="h-64">
          <div className="flex snap-x snap-mandatory overflow-x-auto">
            {Array.isArray(submission.images) && submission.images.map((image: string, i: number) => (
              <div key={i} className="snap-center shrink-0 w-full h-64">
                <GlobalTaskCover 
                  cover={image} 
                  size="lg" 
                  alt={`${submission.title} - 图片 ${i+1}`}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
        {Array.isArray(submission.images) && submission.images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {submission.images.map((_: string, i: number) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70"></div>
            ))}
          </div>
        )}
      </div>
      <CardContent className="pt-4 px-6">
        <div className="flex items-center mb-3">
          <GlobalAvatar 
            user={{ avatar: submission.avatar, username: submission.username }} 
            size="sm" 
            className="mr-2"
          />
          <span className="font-medium">{submission.username}</span>
        </div>
        <h3 className="text-lg font-semibold mb-1">{submission.title}</h3>
        <p className="text-muted-foreground text-sm">{submission.description}</p>
      </CardContent>
      <CardFooter className="flex flex-col border-t pt-4 px-6">
        <TaskUserSubmitCardOperation 
          likes={submission.likes} 
          createdAt={submission.createdAt} 
          taskId={taskId}
          submissionId={submission.id}
          onCommentCountChange={onCommentCountChange}
        />
      </CardFooter>
    </Card>
  )
}
