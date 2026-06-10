import { getDebts } from '@/lib/dal/debts'
import { getAccounts } from '@/lib/dal/accounts'
import { getPots } from '@/lib/dal/pots'
import { getHouseholdMembers } from '@/lib/dal/household-members'
import { DebtList } from '@/components/debts/debt-list'
import { PageTransition } from '@/components/page-transition'

export default async function DebtsPage() {
  const [debts, accounts, pots, members] = await Promise.all([
    getDebts(),
    getAccounts(),
    getPots(),
    getHouseholdMembers(),
  ])
  return (
    <PageTransition>
      <div className="px-6 md:px-8 py-8">
        <DebtList debts={debts} accounts={accounts} pots={pots} members={members} />
      </div>
    </PageTransition>
  )
}
