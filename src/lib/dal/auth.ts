import 'server-only'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Note: getUserByEmail and createUser intentionally do NOT call verifySession() — they are used
// during login/registration before authentication is established. This is a documented exception.
// All other DAL functions must call verifySession().
export async function getUserByEmail(
  email: string
): Promise<typeof users.$inferSelect | undefined> {
  const rows = await db.select().from(users).where(eq(users.email, email))
  return rows[0]
}

export async function createUser(
  email: string,
  passwordHash: string
): Promise<typeof users.$inferSelect> {
  const rows = await db
    .insert(users)
    .values({ email, passwordHash })
    .returning()
  return rows[0]
}
