import { getIncomes } from '@/lib/dal/incomes'
import { getHouseholdMembers } from '@/lib/dal/household-members'
import { IncomeList } from '@/components/pay/income-list'
import { PageTransition } from '@/components/page-transition'

export default async function PayPage() {
  const [incomes, members] = await Promise.all([getIncomes(), getHouseholdMembers()])
  return (
    <PageTransition>
      <IncomeList incomes={incomes} members={members} />
    </PageTransition>
  )
}
