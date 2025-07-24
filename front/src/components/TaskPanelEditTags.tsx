import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'

interface TaskPanelEditTagsProps {
  tags: string[]
  onChange: (tags: string[]) => void
  className?: string
}

export function TaskPanelEditTags({ tags, onChange, className = '' }: TaskPanelEditTagsProps) {
  const [inputValue, setInputValue] = React.useState('')

  const handleAddTag = () => {
    const trimmedValue = inputValue.trim()
    if (trimmedValue && !tags.includes(trimmedValue)) {
      onChange([...tags, trimmedValue])
      setInputValue('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>标签</Label>
      
      {/* 标签输入区域 */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="输入标签名称"
          className="flex-1"
        />
        <Button 
          type="button" 
          size="sm" 
          onClick={handleAddTag}
          disabled={!inputValue.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* 标签显示区域 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => handleRemoveTag(tag)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* 提示信息 */}
      {tags.length === 0 && (
        <p className="text-xs text-muted-foreground">
          暂无标签，请添加标签来更好地分类任务
        </p>
      )}
    </div>
  )
}
