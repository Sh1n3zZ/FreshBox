import { useTranslation } from 'react-i18next'
import { Search, Filter, Trophy, Users, Calendar, ShoppingBag, Utensils } from 'lucide-react'
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

const mockChallenges = [
  {
    id: 1,
    title: "夏日清凉料理挑战",
    description: "使用盲盒食材制作清爽的夏日料理，赢取丰厚奖励",
    difficulty: "easy",
    participants: 246,
    deadline: "2024-08-31",
    tags: ["夏季限定", "清凉料理"],
    image: "/images/challenge1.jpg"
  },
  {
    id: 2,
    title: "家常菜改造挑战",
    description: "用盲盒中的神秘食材改造传统家常菜，焕发新活力",
    difficulty: "medium",
    participants: 178,
    deadline: "2024-09-15",
    tags: ["创意料理", "家常菜"],
    image: "/images/challenge2.jpg"
  },
  {
    id: 3,
    title: "米其林风格料理挑战",
    description: "使用盲盒食材制作高级餐厅风格的精致料理",
    difficulty: "hard",
    participants: 92,
    deadline: "2024-10-01",
    tags: ["高级料理", "精致摆盘"],
    image: "/images/challenge3.jpg"
  }
];

export default function Explore() {
  const { t } = useTranslation()

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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('dashboard.tasks.search-placeholder')}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select>
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
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 挑战卡片列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockChallenges.map((challenge) => (
          <Card key={challenge.id} className="hover:shadow-lg transition-shadow overflow-hidden">
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
                src={challenge.image || '/images/placeholder.jpg'} 
                alt={challenge.title}
                className="w-full h-full object-cover transition-transform hover:scale-105"
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
                <Button variant="outline" size="sm">
                  <ShoppingBag className="mr-1 h-3 w-3" />
                  {t('dashboard.tasks.buy-blindbox')}
                </Button>
                <Button size="sm">
                  <Utensils className="mr-1 h-3 w-3" />
                  {t('dashboard.tasks.join')}
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
} 