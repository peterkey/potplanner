import { getSavingsGoals, getSavingsGoalProgress } from '@/lib/dal/savings-goals'
import { getPots } from '@/lib/dal/pots'
import { getHouseholdMembers } from '@/lib/dal/household-members'
import { getIncomes } from '@/lib/dal/incomes'
import { SavingsList } from '@/components/savings/savings-list'
import { PageTransition } from '@/components/page-transition'

export default async function SavingsPage() {
  const [goals, pots, members, incomes] = await Promise.all([
    getSavingsGoals(),
    getPots(),
    getHouseholdMembers(),
    getIncomes(),
  ])

  const goalsWithProgress = await Promise.all(
    goals.map(async (goal) => ({
      ...goal,
      savedPence: await getSavingsGoalProgress(goal.id, goal.potId),
    }))
  )

  return (
    <PageTransition>
      <div className="px-6 md:px-8 py-8">
        <SavingsList
          goals={goalsWithProgress}
          pots={pots}
          members={members}
          incomes={incomes.map((i) => ({ memberId: i.memberId ?? null, frequency: i.frequency }))}
        />
      </div>
    </PageTransition>
  )
}
