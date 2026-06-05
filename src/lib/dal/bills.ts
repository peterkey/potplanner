import 'server-only'
import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { bills, billSplits, transferHistory } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { advanceByFrequency } from '@/lib/engine/bills'
import type { BillFrequency } from '@/lib/engine/types'

export async function getBills() {
  await verifySession()
  return db.select().from(bills).orderBy(bills.nextDueDate)
}

export async function getBillsWithSplits() {
  await verifySession()
  const allBills = await db.select().from(bills).orderBy(bills.nextDueDate)
  const allSplits = await db.select().from(billSplits)
  return allBills.map((bill) => ({
    ...bill,
    splits: allSplits.filter((s) => s.billId === bill.id),
  }))
}

export async function createBill(
  name: string,
  amountPence: number,
  frequency: BillFrequency,
  potId: number | null,
  nextDueDate: Date,
  splits: Array<{ memberName: string; percentage: number }>
) {
  await verifySession()
  const [bill] = await db
    .insert(bills)
    .values({ name, amountPence, frequency, potId, nextDueDate })
    .returning()
  if (splits.length > 0) {
    await db.insert(billSplits).values(
      splits.map((s) => ({ billId: bill.id, memberName: s.memberName, percentage: s.percentage }))
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
  nextDueDate: Date,
  splits: Array<{ memberName: string; percentage: number }>
) {
  await verifySession()
  const [bill] = await db
    .update(bills)
    .set({ name, amountPence, frequency, potId, nextDueDate })
    .where(eq(bills.id, id))
    .returning()
  await db.delete(billSplits).where(eq(billSplits.billId, id))
  if (splits.length > 0) {
    await db.insert(billSplits).values(
      splits.map((s) => ({ billId: id, memberName: s.memberName, percentage: s.percentage }))
    )
  }
  return bill
}

export async function deleteBill(id: number) {
  await verifySession()
  await db.delete(billSplits).where(eq(billSplits.billId, id))
  await db.delete(bills).where(eq(bills.id, id))
}

export async function markBillPaid(id: number) {
  await verifySession()
  const [bill] = await db.select().from(bills).where(eq(bills.id, id))
  if (!bill || bill.isPaid) return
  await db.update(bills).set({ isPaid: true }).where(eq(bills.id, id))
  await db.insert(transferHistory).values({
    sourceType: bill.potId ? 'pot' : 'account',
    sourceId: bill.potId ?? null,
    destinationType: 'external',
    destinationId: null,
    amountPence: bill.amountPence,
    description: bill.name,
  })
}

export async function markBillUnpaid(id: number) {
  await verifySession()
  const [bill] = await db.select().from(bills).where(and(eq(bills.id, id), eq(bills.isPaid, true)))
  if (!bill) return
  await db.update(bills).set({ isPaid: false }).where(eq(bills.id, id))
  // Compensating entry (append-only ledger pattern)
  await db.insert(transferHistory).values({
    sourceType: 'external',
    sourceId: null,
    destinationType: bill.potId ? 'pot' : 'account',
    destinationId: bill.potId ?? null,
    amountPence: bill.amountPence,
    description: `Reversed: ${bill.name}`,
  })
}

export async function resetAllBillsPaid() {
  await verifySession()
  const paidBills = await db.select().from(bills).where(eq(bills.isPaid, true))
  for (const bill of paidBills) {
    const nextDate = advanceByFrequency(new Date(bill.nextDueDate), bill.frequency as BillFrequency)
    await db
      .update(bills)
      .set({ isPaid: false, nextDueDate: nextDate })
      .where(eq(bills.id, bill.id))
  }
}
