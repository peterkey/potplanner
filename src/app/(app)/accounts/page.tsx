import { getAccountsWithShares } from '@/lib/dal/accounts'
import { getPots } from '@/lib/dal/pots'
import { getBillsWithSplits } from '@/lib/dal/bills'
import { getDebts } from '@/lib/dal/debts'
import { getHouseholdMembers } from '@/lib/dal/household-members'
import { FinancesView } from '@/components/finances/finances-view'
import { PageTransition } from '@/components/page-transition'

export default async function AccountsPage() {
  const [accounts, pots, bills, debts, members] = await Promise.all([
    getAccountsWithShares(),
    getPots(),
    getBillsWithSplits(),
    getDebts(),
    getHouseholdMembers(),
  ])
  return (
    <PageTransition>
      <FinancesView accounts={accounts} pots={pots} bills={bills} debts={debts} members={members} />
    </PageTransition>
  )
}
