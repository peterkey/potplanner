import { getBillsWithSplits } from '@/lib/dal/bills'
import { getPots } from '@/lib/dal/pots'
import { getAccounts } from '@/lib/dal/accounts'
import { BillList } from '@/components/bills/bill-list'

export default async function BillsPage() {
  const [bills, pots, accounts] = await Promise.all([getBillsWithSplits(), getPots(), getAccounts()])
  return (
    <div className="px-6 md:px-8 py-8">
      <BillList bills={bills} pots={pots} accounts={accounts} />
    </div>
  )
}
