import { getBillsWithSplits } from '@/lib/dal/bills'
import { getPots } from '@/lib/dal/pots'
import { BillList } from '@/components/bills/bill-list'

export default async function BillsPage() {
  const [bills, pots] = await Promise.all([getBillsWithSplits(), getPots()])
  return (
    <div className="px-6 md:px-8 py-8">
      <BillList bills={bills} pots={pots} />
    </div>
  )
}
