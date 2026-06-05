import { getSavingsGoals, getSavingsGoalProgress } from '@/lib/dal/savings-goals'
import { getPots } from '@/lib/dal/pots'
import { SavingsList } from '@/components/savings/savings-list'

export default async function SavingsPage() {
  const [goals, pots] = await Promise.all([getSavingsGoals(), getPots()])

  const goalsWithProgress = await Promise.all(
    goals.map(async (goal) => ({
      ...goal,
      savedPence: await getSavingsGoalProgress(goal.id, goal.potId),
    }))
  )

  return (
    <div className="px-6 md:px-8 py-8">
      <SavingsList goals={goalsWithProgress} pots={pots} />
    </div>
  )
}
