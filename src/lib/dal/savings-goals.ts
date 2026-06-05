import 'server-only'
import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { savingsGoals, transferHistory } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function getSavingsGoals() {
  await verifySession()
  return db.select().from(savingsGoals).orderBy(savingsGoals.createdAt)
}

export async function getSavingsGoalProgress(goalId: number, potId: number | null) {
  await verifySession()
  if (!potId) return 0
  // Sum all inflows to the pot as "savings" (pot receives = external → pot)
  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(amount_pence), 0)` })
    .from(transferHistory)
    .where(
      and(
        eq(transferHistory.destinationType, 'pot'),
        eq(transferHistory.destinationId, potId)
      )
    )
  return result[0]?.total ?? 0
}

export async function createSavingsGoal(
  name: string,
  targetPence: number,
  potId: number | null
) {
  await verifySession()
  const [goal] = await db
    .insert(savingsGoals)
    .values({ name, targetPence, potId })
    .returning()
  return goal
}

export async function updateSavingsGoal(
  id: number,
  name: string,
  targetPence: number,
  potId: number | null
) {
  await verifySession()
  const [goal] = await db
    .update(savingsGoals)
    .set({ name, targetPence, potId })
    .where(eq(savingsGoals.id, id))
    .returning()
  return goal
}

export async function deleteSavingsGoal(id: number) {
  await verifySession()
  await db.delete(savingsGoals).where(eq(savingsGoals.id, id))
}
