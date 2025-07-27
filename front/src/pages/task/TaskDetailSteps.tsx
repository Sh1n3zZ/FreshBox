import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import React from 'react'

// 定义 TaskStep 类型
interface TaskStep {
  id: string
  title: string
  description: string
  type: string
  status?: string
  order: number
}

// Props 类型定义
interface TaskDetailStepsProps {
  steps: TaskStep[]
  handleStepAction: (step: TaskStep) => void
  getStepStatusIcon: (status?: string) => React.ReactNode
}

// TaskDetailSteps 组件用于展示挑战步骤
export default function TaskDetailSteps({ steps, handleStepAction, getStepStatusIcon }: TaskDetailStepsProps) {
  // Sort steps by order field to ensure correct display order
  const sortedSteps = [...steps].sort((a, b) => {
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    return orderA - orderB;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>挑战步骤</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedSteps.map((step: TaskStep, index: number) => (
          <div key={step.id} className="relative">
            <div className="flex">
              <div className="mr-4 flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900">
                  {/* Show step status icon */}
                  {getStepStatusIcon(step.status)}
                </div>
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold mb-1">
                    {step.title}
                  </h3>
                  {(step.type === 'purchase' || step.type === 'submit') ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStepAction(step)}
                    >
                      {step.type === 'purchase' ? '购买盲盒' : '提交结果'}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
            {/* Step connector line */}
            {index < sortedSteps.length - 1 && (
              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border h-6"></div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
