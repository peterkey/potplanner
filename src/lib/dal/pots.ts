import 'server-only'
import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { pots } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getPots() {
  await verifySession()
  return db.select().from(pots).orderBy(pots.createdAt)
}

export async function createPot(name: string, allocatedPence: number, rollover: boolean, accountId: number | null) {
  await verifySession()
  const [pot] = await db.insert(pots).values({ name, allocatedPence, rollover, accountId }).returning()
  return pot
}

export async function updatePot(id: number, name: string, allocatedPence: number, rollover: boolean, accountId: number | null) {
  await verifySession()
  const [pot] = await db.update(pots)
    .set({ name, allocatedPence, rollover, accountId })
    .where(eq(pots.id, id))
    .returning()
  return pot
}

export async function updatePotAllocation(id: number, allocatedPence: number) {
  await verifySession()
  const [pot] = await db.update(pots)
    .set({ allocatedPence })
    .where(eq(pots.id, id))
    .returning()
  return pot
}

export async function deletePot(id: number) {
  await verifySession()
  await db.delete(pots).where(eq(pots.id, id))
}

export async function resetAllPotAllocations() {
  await verifySession()
  await db.update(pots).set({ allocatedPence: 0 })
}
