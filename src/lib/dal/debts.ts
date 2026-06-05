import 'server-only'
import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { debts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getDebts() {
  await verifySession()
  return db.select().from(debts).orderBy(debts.createdAt)
}

export async function createDebt(
  name: string,
  balancePence: number,
  interestRate: number,
  minimumPaymentPence: number
) {
  await verifySession()
  const [debt] = await db
    .insert(debts)
    .values({ name, balancePence, interestRate, minimumPaymentPence })
    .returning()
  return debt
}

export async function updateDebt(
  id: number,
  name: string,
  balancePence: number,
  interestRate: number,
  minimumPaymentPence: number
) {
  await verifySession()
  const [debt] = await db
    .update(debts)
    .set({ name, balancePence, interestRate, minimumPaymentPence })
    .where(eq(debts.id, id))
    .returning()
  return debt
}

export async function deleteDebt(id: number) {
  await verifySession()
  await db.delete(debts).where(eq(debts.id, id))
}
