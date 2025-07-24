import { Card, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import { GlobalTaskCover } from '@/components/GlobalTaskCover'
import ExploreTaskCardDesc from './ExploreTaskCardDesc'
import ExploreTaskCardInfo from './ExploreTaskCardInfo'
import ExploreTaskCardOperation from './ExploreTaskCardOperation'

interface Challenge {
  id: string
  title: string
  description: string
  difficulty?: string
  participants?: number
  deadline: string
  tags?: string[] | string
  image?: string
}

interface Props {
  challenge: Challenge
  onClick: () => void
  onBuy: (e: React.MouseEvent) => void
  onJoin: (e: React.MouseEvent) => void
  getDifficultyLabel: (d?: string) => string
  getDifficultyColor: (d?: string) => string
  toTagArray: (tags?: string[] | string) => string[]
}

export default function ExploreTaskCard({ challenge, onClick, onBuy, onJoin, getDifficultyLabel, getDifficultyColor, toTagArray }: Props) {
  const tags = toTagArray(challenge.tags)

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer p-0" onClick={onClick}>
      <div className="relative overflow-hidden aspect-video w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
        <div className="absolute top-2 left-2 z-20">
          <Badge className={getDifficultyColor(challenge.difficulty)}>
            {getDifficultyLabel(challenge.difficulty)}
          </Badge>
        </div>
        <div className="absolute top-2 right-2 z-20 flex items-center text-white bg-black/30 rounded-full px-2 py-1 text-xs">
          <Users className="h-3 w-3 mr-1" />
          <span>{challenge.participants || 0}</span>
        </div>
        <div className="transition-transform hover:scale-105 h-full w-full">
          <GlobalTaskCover cover={challenge.image} size="full" alt={challenge.title} />
        </div>
      </div>

      <ExploreTaskCardDesc challenge={challenge} tags={tags} />

      <CardFooter className="flex flex-col gap-3 border-t pt-4">
        <ExploreTaskCardInfo challenge={challenge} />
        <ExploreTaskCardOperation onBuy={onBuy} onJoin={onJoin} />
      </CardFooter>
    </Card>
  )
}
