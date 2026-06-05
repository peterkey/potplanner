import { getDebts } from '@/lib/dal/debts'
import { DebtList } from '@/components/debts/debt-list'

export default async function DebtsPage() {
  const debts = await getDebts()
  return (
    <div className="px-6 md:px-8 py-8">
      <DebtList debts={debts} />
    </div>
  )
}
