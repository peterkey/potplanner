import 'server-only'
import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { householdMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getHouseholdMembers() {
  await verifySession()
  return db.select().from(householdMembers).orderBy(householdMembers.name)
}

export async function createHouseholdMember(name: string) {
  await verifySession()
  const [member] = await db.insert(householdMembers).values({ name }).returning()
  return member
}

export async function updateHouseholdMember(id: number, name: string) {
  await verifySession()
  const [member] = await db
    .update(householdMembers)
    .set({ name })
    .where(eq(householdMembers.id, id))
    .returning()
  return member
}

export async function deleteHouseholdMember(id: number) {
  await verifySession()
  await db.delete(householdMembers).where(eq(householdMembers.id, id))
}
