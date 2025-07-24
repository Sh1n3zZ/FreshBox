import { Calendar, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Challenge {
  deadline: string
}

interface Props {
  challenge: Challenge
}

export default function ExploreTaskCardInfo({ challenge }: Props) {
  const { t } = useTranslation()
  return (
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
  )
}
