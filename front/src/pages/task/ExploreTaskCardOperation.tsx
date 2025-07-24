import { Button } from '@/components/ui/button'
import { ShoppingBag, Utensils } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  onBuy: (e: React.MouseEvent) => void
  onJoin: (e: React.MouseEvent) => void
}

export default function ExploreTaskCardOperation({ onBuy, onJoin }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex justify-between w-full mb-8">
      <Button variant="outline" size="sm" onClick={onBuy}>
        <ShoppingBag className="mr-1 h-3 w-3" />
        {t('dashboard.tasks.buy-blindbox')}
      </Button>
      <Button size="sm" onClick={onJoin}>
        <Utensils className="mr-1 h-3 w-3" />
        {t('dashboard.tasks.join')}
      </Button>
    </div>
  )
}
