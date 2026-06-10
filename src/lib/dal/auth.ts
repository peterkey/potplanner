import 'server-only'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Note: getUserByEmail, getUserById, and createUser intentionally do NOT call verifySession() —
// they are used during login/registration before authentication is established, or by admin
// API routes that perform their own admin check. This is a documented exception.
// All other DAL functions must call verifySession().

export async function getUserByEmail(
  email: string
): Promise<typeof users.$inferSelect | undefined> {
  const rows = await db.select().from(users).where(eq(users.email, email))
  return rows[0]
}

export async function getUserById(
  id: number
): Promise<typeof users.$inferSelect | undefined> {
  const rows = await db.select().from(users).where(eq(users.id, id))
  return rows[0]
}

export async function getAllUsers(): Promise<typeof users.$inferSelect[]> {
  return db.select().from(users).orderBy(users.createdAt)
}

export async function getAllUsersSafe() {
  return db
    .select({ id: users.id, email: users.email, isAdmin: users.isAdmin, createdAt: users.createdAt })
    .from(users)
    .orderBy(users.createdAt)
}

export async function createUser(
  email: string,
  passwordHash: string,
  isAdmin = false
): Promise<typeof users.$inferSelect> {
  const rows = await db
    .insert(users)
    .values({ email, passwordHash, isAdmin })
    .returning()
  return rows[0]
}

export async function deleteUserById(id: number): Promise<void> {
  await db.delete(users).where(eq(users.id, id))
}
