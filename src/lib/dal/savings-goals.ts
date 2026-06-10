import 'server-only'
import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { savingsGoals, savingsGoalMembers, transferHistory, householdMembers } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function getSavingsGoals() {
  await verifySession()
  const allGoals = await db.select().from(savingsGoals).orderBy(savingsGoals.createdAt)
  const allMembers = await db
    .select({
      goalId: savingsGoalMembers.goalId,
      memberId: savingsGoalMembers.memberId,
      memberName: householdMembers.name,
      percentage: savingsGoalMembers.percentage,
    })
    .from(savingsGoalMembers)
    .leftJoin(householdMembers, eq(savingsGoalMembers.memberId, householdMembers.id))

  return allGoals.map((goal) => ({
    ...goal,
    members: allMembers
      .filter((m) => m.goalId === goal.id && m.memberId !== null)
      .map((m) => ({
        memberId: m.memberId!,
        memberName: m.memberName ?? '',
        percentage: m.percentage,
      })),
  }))
}

export async function getSavingsGoalProgress(goalId: number, potId: number | null) {
  await verifySession()
  if (!potId) return 0
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
  goalDate: Date | null,
  potId: number | null,
  contributors: Array<{ memberId: number; percentage: number }>
) {
  await verifySession()
  const [goal] = await db
    .insert(savingsGoals)
    .values({ name, targetPence, goalDate: goalDate ?? undefined, potId })
    .returning()
  if (contributors.length > 0) {
    await db.insert(savingsGoalMembers).values(
      contributors.map((c) => ({ goalId: goal.id, memberId: c.memberId, percentage: c.percentage }))
    )
  }
  return goal
}

export async function updateSavingsGoal(
  id: number,
  name: string,
  targetPence: number,
  goalDate: Date | null,
  potId: number | null,
  contributors: Array<{ memberId: number; percentage: number }>
) {
  await verifySession()
  const [goal] = await db
    .update(savingsGoals)
    .set({ name, targetPence, goalDate: goalDate ?? null, potId })
    .where(eq(savingsGoals.id, id))
    .returning()
  await db.delete(savingsGoalMembers).where(eq(savingsGoalMembers.goalId, id))
  if (contributors.length > 0) {
    await db.insert(savingsGoalMembers).values(
      contributors.map((c) => ({ goalId: id, memberId: c.memberId, percentage: c.percentage }))
    )
  }
  return goal
}

export async function deleteSavingsGoal(id: number) {
  await verifySession()
  await db.delete(savingsGoalMembers).where(eq(savingsGoalMembers.goalId, id))
  await db.delete(savingsGoals).where(eq(savingsGoals.id, id))
}
