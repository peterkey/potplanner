import 'server-only'
import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { incomes, householdMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getIncomes() {
  await verifySession()
  const rows = await db
    .select({
      id: incomes.id,
      name: incomes.name,
      amountPence: incomes.amountPence,
      frequency: incomes.frequency,
      nextPayDate: incomes.nextPayDate,
      memberId: incomes.memberId,
      memberName: householdMembers.name,
      createdAt: incomes.createdAt,
    })
    .from(incomes)
    .leftJoin(householdMembers, eq(incomes.memberId, householdMembers.id))
    .orderBy(incomes.createdAt)
  return rows.map((r) => ({ ...r, memberName: r.memberName ?? null }))
}

export async function createIncome(
  name: string,
  amountPence: number,
  frequency: string,
  nextPayDate: Date,
  memberId: number | null,
) {
  await verifySession()
  const [row] = await db
    .insert(incomes)
    .values({ name, amountPence, frequency, nextPayDate, memberId })
    .returning()
  return row
}

export async function updateIncome(
  id: number,
  name: string,
  amountPence: number,
  frequency: string,
  nextPayDate: Date,
  memberId: number | null,
) {
  await verifySession()
  const [row] = await db
    .update(incomes)
    .set({ name, amountPence, frequency, nextPayDate, memberId })
    .where(eq(incomes.id, id))
    .returning()
  return row
}

export async function deleteIncome(id: number) {
  await verifySession()
  await db.delete(incomes).where(eq(incomes.id, id))
}
