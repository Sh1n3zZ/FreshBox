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
import { apiService } from '@/lib/api'

// 定义挑战接口
interface ApiResponse {
  data: Challenge[];
  msg: string;
  trace_id: string;
}

interface Challenge {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'ongoing' | 'completed';
  created_at: string;
  deadline: string;
  reward: number;
}

// Mock数据
const mockChallenges: Challenge[] = [
  {
    id: "e3246257-aec5-4cf6-a338-f4ef229b5704",
    user_id: "mock-user-id-1",
    type: "recipe_challenge",
    title: "创意料理挑战",
    description: "使用盲盒食材制作一道创意料理，并分享照片和做法",
    status: "ongoing",
    created_at: "2025-04-26T23:34:38.7470149+08:00",
    deadline: "2025-05-03T23:34:38.7470149+08:00",
    reward: 50
  },
  {
    id: "a56b3dcc-8ad2-4a0c-8eb8-bd407159322f",
    user_id: "mock-user-id-2",
    type: "food_rescue",
    title: "食物拯救行动",
    description: "收集并分享5个减少食物浪费的实用技巧",
    status: "pending",
    created_at: "2025-04-25T23:34:38.7470149+08:00",
    deadline: "2025-04-30T23:34:38.7470149+08:00",
    reward: 30
  },
  {
    id: "4c3307b3-5f64-4f44-9fb2-0a377b1784a6",
    user_id: "mock-user-id-3",
    type: "community_sharing",
    title: "社区分享会",
    description: "组织一次小型的临期食品分享活动，并记录过程",
    status: "completed",
    created_at: "2025-04-20T23:34:38.7470149+08:00",
    deadline: "2025-04-25T23:34:38.7470149+08:00",
    reward: 100
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
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiService.get<ApiResponse>('/tasks');
        
        // 验证返回的数据是否正确
        if (response && response.data && Array.isArray(response.data)) {
          setChallenges(response.data);
          setFilteredChallenges(response.data);
        } else {
          console.error('API返回的数据格式不正确:', response);
          setError('获取数据格式不正确，请稍后再试');
          
          // 开发环境下使用mock数据
          if (import.meta.env.DEV) {
            setChallenges(mockChallenges);
            setFilteredChallenges(mockChallenges);
          }
        }
      } catch (error) {
        console.error('获取挑战数据失败:', error);
        setError('获取挑战数据失败，请稍后再试');
        
        // 加载失败时使用Mock数据作为备用
        if (import.meta.env.DEV) {
          setChallenges(mockChallenges);
          setFilteredChallenges(mockChallenges);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchChallenges();
  }, []);
  
  // 筛选逻辑 - 使用防抖后的搜索关键词
  useEffect(() => {
    // 确保challenges是一个数组
    if (!Array.isArray(challenges)) {
      setFilteredChallenges([]);
      return;
    }
    
    let result = [...challenges];
    
    // 筛选状态
    if (status !== 'all') {
      result = result.filter(challenge => challenge.status === status);
    }
    
    // 搜索关键词
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      result = result.filter(challenge => 
        challenge.title.toLowerCase().includes(query) || 
        challenge.description.toLowerCase().includes(query) ||
        challenge.type.toLowerCase().includes(query)
      );
    }
    
    setFilteredChallenges(result);
  }, [challenges, status, debouncedSearchQuery]);
  
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
  const handleStatusChange = (value: string) => {
    setStatus(value);
  }
  
  // 重置筛选
  const resetFilters = useCallback(() => {
    handleClearSearch();
    setStatus('all');
  }, [handleClearSearch]);

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending': return '待开始';
      case 'ongoing': return '进行中';
      case 'completed': return '已完成';
      default: return '全部状态';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'ongoing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return '';
    }
  };

  const getTaskIcon = (type: string) => {
    switch(type) {
      case 'recipe_challenge': return <Utensils className="h-3 w-3 mr-1" />;
      case 'food_rescue': return <ShoppingBag className="h-3 w-3 mr-1" />;
      case 'community_sharing': return <Users className="h-3 w-3 mr-1" />;
      default: return <Trophy className="h-3 w-3 mr-1" />;
    }
  }

  const handleTaskClick = (taskId: string) => {
    navigate(`/task/detail/${taskId}`);
  }
  
  // 参与挑战
  const handleJoinChallenge = (e: React.MouseEvent, challengeId: string) => {
    e.stopPropagation(); // 阻止事件冒泡
    navigate(`/task/detail/${challengeId}`);
  }

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
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('dashboard.tasks.filter-status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('dashboard.tasks.status-all')}</SelectItem>
              <SelectItem value="pending">{t('dashboard.tasks.status-pending')}</SelectItem>
              <SelectItem value="ongoing">{t('dashboard.tasks.status-ongoing')}</SelectItem>
              <SelectItem value="completed">{t('dashboard.tasks.status-completed')}</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={resetFilters} 
            disabled={status === 'all' && !searchQuery}
            title="重置筛选"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 筛选结果提示 */}
      {(status !== 'all' || debouncedSearchQuery) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">筛选结果:</span>
          {status !== 'all' && (
            <Badge variant="secondary" className="flex items-center">
              <span>状态: {getStatusLabel(status)}</span>
              <button 
                className="ml-1 p-1 hover:bg-muted rounded-full" 
                onClick={() => setStatus('all')}
                aria-label="移除状态筛选"
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

      {/* 错误提示 */}
      {error && !loading && (
        <div className="py-6 text-center">
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              重新加载
            </Button>
          </div>
        </div>
      )}

      {/* 无结果提示 */}
      {!loading && !isSearching && !error && filteredChallenges.length === 0 && (
        <div className="py-12 text-center">
          <div className="mb-4">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto" />
          </div>
          <h3 className="text-xl font-medium mb-2">未找到匹配的挑战</h3>
          <p className="text-muted-foreground mb-4">
            {status !== 'all' && debouncedSearchQuery 
              ? '尝试调整您的筛选条件或搜索关键词' 
              : status !== 'all' 
                ? '尝试选择其他状态' 
                : '尝试使用其他搜索关键词'}
          </p>
          <Button onClick={resetFilters}>
            重置所有筛选
          </Button>
        </div>
      )}

      {/* 挑战卡片列表 */}
      {!loading && !isSearching && !error && filteredChallenges.length > 0 && (
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
                  <Badge className={getStatusColor(challenge.status)}>
                    {getStatusLabel(challenge.status)}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2 z-20 flex items-center text-white bg-black/30 rounded-full px-2 py-1 text-xs">
                  {getTaskIcon(challenge.type)}
                  <span>{challenge.reward} 积分</span>
                </div>
                <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/30 flex items-center justify-center">
                  {getTaskIcon(challenge.type)}
                  <span className="text-lg font-medium ml-2">{challenge.type}</span>
                </div>
              </div>
              
              <CardContent className="pt-4">
                <h3 className="text-xl font-semibold mb-2">{challenge.title}</h3>
                <p className="text-muted-foreground mb-3">{challenge.description}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {challenge.type}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    奖励: {challenge.reward} 积分
                  </Badge>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-3 border-t pt-4">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>截止日期: {formatDate(challenge.deadline)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Trophy className="h-3 w-3" />
                    <span>奖励: {challenge.reward} 积分</span>
                  </div>
                </div>
                <div className="flex justify-between w-full">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/task/detail/${challenge.id}`);
                    }}
                  >
                    <Trophy className="mr-1 h-3 w-3" />
                    查看详情
                  </Button>
                  <Button 
                    size="sm"
                    onClick={(e) => handleJoinChallenge(e, challenge.id)}
                  >
                    {getTaskIcon(challenge.type)}
                    参与挑战
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

// 格式化日期函数
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateString;
  }
}