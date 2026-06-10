import 'server-only'
import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { bills, billSplits, transferHistory, householdMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { BillFrequency } from '@/lib/engine/types'

export async function getBills() {
  await verifySession()
  return db.select().from(bills).orderBy(bills.nextDueDate)
}

export async function getBillsWithSplits() {
  await verifySession()
  const allBills = await db.select().from(bills).orderBy(bills.nextDueDate)
  const allSplits = await db
    .select({
      id: billSplits.id,
      billId: billSplits.billId,
      memberId: billSplits.memberId,
      memberName: householdMembers.name,
      percentage: billSplits.percentage,
    })
    .from(billSplits)
    .leftJoin(householdMembers, eq(billSplits.memberId, householdMembers.id))

  return allBills.map((bill) => ({
    ...bill,
    splits: allSplits
      .filter((s) => s.billId === bill.id && s.memberId !== null)
      .map((s) => ({
        id: s.id,
        billId: s.billId,
        memberId: s.memberId!,
        memberName: s.memberName ?? '',
        percentage: s.percentage,
      })),
  }))
}

export async function createBill(
  name: string,
  amountPence: number,
  frequency: BillFrequency,
  potId: number | null,
  accountId: number | null,
  nextDueDate: Date,
  splits: Array<{ memberId: number; percentage: number }>
) {
  await verifySession()
  const [bill] = await db
    .insert(bills)
    .values({ name, amountPence, frequency, potId, accountId, nextDueDate })
    .returning()
  if (splits.length > 0) {
    await db.insert(billSplits).values(
      splits.map((s) => ({ billId: bill.id, memberId: s.memberId, percentage: s.percentage }))
    )
  }
  return bill
}

export async function updateBill(
  id: number,
  name: string,
  amountPence: number,
  frequency: BillFrequency,
  potId: number | null,
  accountId: number | null,
  nextDueDate: Date,
  splits: Array<{ memberId: number; percentage: number }>
) {
  await verifySession()
  const [bill] = await db
    .update(bills)
    .set({ name, amountPence, frequency, potId, accountId, nextDueDate })
    .where(eq(bills.id, id))
    .returning()
  await db.delete(billSplits).where(eq(billSplits.billId, id))
  if (splits.length > 0) {
    await db.insert(billSplits).values(
      splits.map((s) => ({ billId: id, memberId: s.memberId, percentage: s.percentage }))
    )
  }
  return bill
}

export async function deleteBill(id: number) {
  await verifySession()
  await db.delete(billSplits).where(eq(billSplits.billId, id))
  await db.delete(bills).where(eq(bills.id, id))
}

