import { getBillsWithSplits } from '@/lib/dal/bills'
import { getPots } from '@/lib/dal/pots'
import { getAccountsWithShares } from '@/lib/dal/accounts'
import { getHouseholdMembers } from '@/lib/dal/household-members'
import { BillList } from '@/components/bills/bill-list'
import { PageTransition } from '@/components/page-transition'

export default async function BillsPage() {
  const [bills, pots, accounts, members] = await Promise.all([
    getBillsWithSplits(),
    getPots(),
    getAccountsWithShares(),
    getHouseholdMembers(),
  ])
  return (
    <PageTransition>
      <div className="px-6 md:px-8 py-8">
        <BillList bills={bills} pots={pots} accounts={accounts} members={members} />
      </div>
    </PageTransition>
  )
}
