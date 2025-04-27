import { useTranslation } from 'react-i18next'
import { Search, Filter, Trophy, Users, Calendar, ShoppingBag, Utensils, X } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { API_URLS } from '@/conf/env'

// 定义挑战接口
interface Challenge {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  participants: number;
  deadline: string;
  tags: string[];
  image: string;
}

// Mock数据
const mockChallenges = [
  {
    id: 1,
    title: "夏日清凉料理挑战",
    description: "使用盲盒食材制作清爽的夏日料理，赢取丰厚奖励",
    difficulty: "easy",
    participants: 246,
    deadline: "2024-08-31",
    tags: ["夏季限定", "清凉料理"],
    image: "/images/ximilu.jpg"
  },
  {
    id: 2,
    title: "家常菜改造挑战",
    description: "用盲盒中的神秘食材改造传统家常菜，焕发新活力",
    difficulty: "medium",
    participants: 178,
    deadline: "2024-09-15",
    tags: ["创意料理", "家常菜"],
    image: "/images/homeusualfood.jpeg"
  },
  {
    id: 3,
    title: "米其林风格料理挑战",
    description: "使用盲盒食材制作高级餐厅风格的精致料理",
    difficulty: "hard",
    participants: 92,
    deadline: "2024-10-01",
    tags: ["高级料理", "精致摆盘"],
    image: "/images/beefmql.jpg"
  }
];

export default function Explore() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  // 状态管理
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [difficulty, setDifficulty] = useState('all')
  const [loading, setLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  // 搜索防抖
  useEffect(() => {
    setIsSearching(true)
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setIsSearching(false)
    }, 300) // 300ms延迟
    
    return () => {
      clearTimeout(timer)
    }
  }, [searchQuery])
  
  // 获取挑战数据
  useEffect(() => {
    const fetchChallenges = async () => {
      setLoading(true)
      
      try {
        // 真实API调用
        if (process.env.NODE_ENV === 'production') {
          const response = await fetch(API_URLS.TASK.LIST)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const data = await response.json()
          setChallenges(data)
          setFilteredChallenges(data)
        } else {
          // Mock数据
          setTimeout(() => {
            setChallenges(mockChallenges)
            setFilteredChallenges(mockChallenges)
          }, 300)
        }
      } catch (error) {
        console.error('Failed to fetch challenges:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchChallenges()
  }, [])
  
  // 筛选逻辑 - 使用防抖后的搜索关键词
  useEffect(() => {
    let result = challenges
    
    // 筛选难度
    if (difficulty !== 'all') {
      result = result.filter(challenge => challenge.difficulty === difficulty)
    }
    
    // 搜索关键词
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim()
      result = result.filter(challenge => 
        challenge.title.toLowerCase().includes(query) || 
        challenge.description.toLowerCase().includes(query) ||
        challenge.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    setFilteredChallenges(result)
  }, [challenges, difficulty, debouncedSearchQuery])
  
  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }
  
  // 处理搜索重置
  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setDebouncedSearchQuery('')
  }, [])
  
  // 处理难度筛选
  const handleDifficultyChange = (value: string) => {
    setDifficulty(value)
  }
  
  // 重置筛选
  const resetFilters = useCallback(() => {
    handleClearSearch()
    setDifficulty('all')
  }, [handleClearSearch])

  const getDifficultyLabel = (difficulty: string) => {
    switch(difficulty) {
      case 'easy': return t('dashboard.tasks.difficulty-easy');
      case 'medium': return t('dashboard.tasks.difficulty-medium');
      case 'hard': return t('dashboard.tasks.difficulty-hard');
      default: return t('dashboard.tasks.difficulty-all');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return '';
    }
  };

  const handleTaskClick = (taskId: number) => {
    navigate(`/task/detail/${taskId}`)
  }
  
  // 购买盲盒
  const handleBuyBlindbox = (e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡
    navigate('/blindbox/detail/summer-special')
  }
  
  // 参与挑战
  const handleJoinChallenge = (e: React.MouseEvent, challengeId: number) => {
    e.stopPropagation() // 阻止事件冒泡
    navigate(`/task/detail/${challengeId}`)
  }

  // 添加图片错误处理函数
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.onerror = null; // 防止循环加载
    target.src = '/images/placeholder.jpg';
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">{t('dashboard.tasks.explore-title')}</h1>
        </div>
        <p className="text-muted-foreground">{t('dashboard.tasks.explore-description')}</p>
      </div>

      {/* 搜索和筛选区域 */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isSearching ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
          <Input
            placeholder={t('dashboard.tasks.search-placeholder')}
            className="pl-10"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button 
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              onClick={handleClearSearch}
              aria-label="清除搜索"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={difficulty} onValueChange={handleDifficultyChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('dashboard.tasks.filter-difficulty')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('dashboard.tasks.difficulty-all')}</SelectItem>
              <SelectItem value="easy">{t('dashboard.tasks.difficulty-easy')}</SelectItem>
              <SelectItem value="medium">{t('dashboard.tasks.difficulty-medium')}</SelectItem>
              <SelectItem value="hard">{t('dashboard.tasks.difficulty-hard')}</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={resetFilters} 
            disabled={difficulty === 'all' && !searchQuery}
            title="重置筛选"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 筛选结果提示 */}
      {(difficulty !== 'all' || debouncedSearchQuery) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">筛选结果:</span>
          {difficulty !== 'all' && (
            <Badge variant="secondary" className="flex items-center">
              <span>难度: {getDifficultyLabel(difficulty)}</span>
              <button 
                className="ml-1 p-1 hover:bg-muted rounded-full" 
                onClick={() => setDifficulty('all')}
                aria-label="移除难度筛选"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {debouncedSearchQuery && (
            <Badge variant="secondary" className="flex items-center">
              <span>搜索: {debouncedSearchQuery}</span>
              <button 
                className="ml-1 p-1 hover:bg-muted rounded-full" 
                onClick={handleClearSearch}
                aria-label="移除搜索筛选"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="ml-auto" onClick={resetFilters}>
            重置所有筛选
          </Button>
        </div>
      )}

      {/* 加载中状态 */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : isSearching ? (
        <div className="py-4 flex justify-center">
          <div className="text-sm text-muted-foreground">正在搜索...</div>
        </div>
      ) : null}

      {/* 无结果提示 */}
      {!loading && !isSearching && filteredChallenges.length === 0 && (
        <div className="py-12 text-center">
          <div className="mb-4">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto" />
          </div>
          <h3 className="text-xl font-medium mb-2">未找到匹配的挑战</h3>
          <p className="text-muted-foreground mb-4">
            {difficulty !== 'all' && debouncedSearchQuery 
              ? '尝试调整您的筛选条件或搜索关键词' 
              : difficulty !== 'all' 
                ? '尝试选择其他难度等级' 
                : '尝试使用其他搜索关键词'}
          </p>
          <Button onClick={resetFilters}>
            重置所有筛选
          </Button>
        </div>
      )}

      {/* 挑战卡片列表 */}
      {!loading && !isSearching && filteredChallenges.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map((challenge) => (
            <Card 
              key={challenge.id} 
              className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
              onClick={() => handleTaskClick(challenge.id)}
            >
              <div className="h-40 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                <div className="absolute top-2 left-2 z-20">
                  <Badge className={getDifficultyColor(challenge.difficulty)}>
                    {getDifficultyLabel(challenge.difficulty)}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2 z-20 flex items-center text-white bg-black/30 rounded-full px-2 py-1 text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  <span>{challenge.participants}</span>
                </div>
                <img 
                  src={challenge.image} 
                  alt={challenge.title}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                  onError={handleImageError}
                />
              </div>
              
              <CardContent className="pt-4">
                <h3 className="text-xl font-semibold mb-2">{challenge.title}</h3>
                <p className="text-muted-foreground mb-3">{challenge.description}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {challenge.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-3 border-t pt-4">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{t('dashboard.tasks.deadline')}: {challenge.deadline}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ShoppingBag className="h-3 w-3" />
                    <span>{t('dashboard.tasks.blindbox-required')}</span>
                  </div>
                </div>
                <div className="flex justify-between w-full">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleBuyBlindbox}
                  >
                    <ShoppingBag className="mr-1 h-3 w-3" />
                    {t('dashboard.tasks.buy-blindbox')}
                  </Button>
                  <Button 
                    size="sm"
                    onClick={(e) => handleJoinChallenge(e, challenge.id)}
                  >
                    <Utensils className="mr-1 h-3 w-3" />
                    {t('dashboard.tasks.join')}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}