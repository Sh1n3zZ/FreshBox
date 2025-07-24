import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Props for TaskDetailNav
interface TaskDetailNavProps {
  title: string
}

export default function TaskDetailNav({ title }: TaskDetailNavProps) {
  const navigate = useNavigate();

  // 返回到挑战列表页面
  const goBackToExplore = () => {
    navigate('/task/explore');
  };

  return (
    <>
      <div className="mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center text-muted-foreground hover:text-foreground"
          onClick={goBackToExplore}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回挑战列表
        </Button>
      </div>
      <nav className="flex mb-4 text-sm items-center">
        <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => navigate('/')}> 
          <Home className="h-3.5 w-3.5 mr-1" />
          <span>首页</span>
        </Button>
        <ChevronRightIcon className="h-3 w-3 mx-2 text-muted-foreground" />
        <Button variant="link" size="sm" className="p-0 h-auto" onClick={goBackToExplore}>
          <span>挑战列表</span>
        </Button>
        <ChevronRightIcon className="h-3 w-3 mx-2 text-muted-foreground" />
        <span className="text-muted-foreground truncate" title={title}>
          {title}
        </span>
      </nav>
    </>
  )
}
