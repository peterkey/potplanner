import { getPots } from '@/lib/dal/pots'
import { PotList } from '@/components/pots/pot-list'

export default async function PotsPage() {
  const pots = await getPots()
  return (
    <div className="px-6 md:px-8 py-8">
      <PotList pots={pots} />
    </div>
  )
}
