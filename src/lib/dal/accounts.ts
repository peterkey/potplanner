import 'server-only'
import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { accounts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getAccounts() {
  await verifySession()
  return db.select().from(accounts).orderBy(accounts.createdAt)
}

export async function createAccount(name: string, initialBalancePence: number) {
  await verifySession()
  const [account] = await db.insert(accounts).values({ name, initialBalancePence }).returning()
  return account
}

export async function updateAccount(id: number, name: string, initialBalancePence: number) {
  await verifySession()
  const [account] = await db.update(accounts)
    .set({ name, initialBalancePence })
    .where(eq(accounts.id, id))
    .returning()
  return account
}

export async function deleteAccount(id: number) {
  await verifySession()
  await db.delete(accounts).where(eq(accounts.id, id))
}
