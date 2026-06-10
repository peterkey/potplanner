import 'server-only'
import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getCurrentUser() {
  const session = await verifySession()
  const rows = await db.select().from(users).where(eq(users.id, session.userId))
  return rows[0] ?? null
}
