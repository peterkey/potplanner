import 'server-only'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Note: getUserByEmail intentionally does NOT call verifySession() — it is used
// during login before authentication is established. This is a documented exception
// per 03-RESEARCH.md. All other DAL functions must call verifySession().
export async function getUserByEmail(
  email: string
): Promise<typeof users.$inferSelect | undefined> {
  const rows = await db.select().from(users).where(eq(users.email, email))
  return rows[0]
}
