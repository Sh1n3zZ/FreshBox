import { Badge } from '@/components/ui/badge'
import { CardContent } from '@/components/ui/card'

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

interface ExploreTaskCardDescProps {
  challenge: Challenge
  tags: string[]
}

export default function ExploreTaskCardDesc({ challenge, tags }: ExploreTaskCardDescProps) {
  return (
    <CardContent className="pt-4">
      <h3 className="text-xl font-semibold mb-2">{challenge.title}</h3>
      <p className="text-muted-foreground mb-3 whitespace-pre-line break-words line-clamp-3">{challenge.description}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </CardContent>
  )
}
