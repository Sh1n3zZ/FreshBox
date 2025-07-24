import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// TaskDetailDescription 组件用于展示挑战描述
export default function TaskDetailDescription({ description }: { description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>挑战描述</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Display the task description, preserving line breaks and word breaks */}
        <p style={{wordBreak: 'break-all', whiteSpace: 'pre-line', overflowWrap: 'break-word'}}>{description}</p>
      </CardContent>
    </Card>
  )
}
