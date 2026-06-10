import { getPots } from '@/lib/dal/pots'
import { getAccountsWithShares } from '@/lib/dal/accounts'
import { PotList } from '@/components/pots/pot-list'
import { PageTransition } from '@/components/page-transition'

export default async function PotsPage() {
  const [pots, accounts] = await Promise.all([getPots(), getAccountsWithShares()])
  return (
    <PageTransition>
      <div className="px-6 md:px-8 py-8">
        <PotList pots={pots} accounts={accounts} />
      </div>
    </PageTransition>
  )
}
