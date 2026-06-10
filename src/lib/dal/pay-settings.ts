import 'server-only'
import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { paySettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getPaySettings() {
  await verifySession()
  const [row] = await db.select().from(paySettings).limit(1)
  return row ?? null
}

export async function upsertPaySettings(
  amountPence: number,
  frequency: string,
  nextPayDate: Date
) {
  await verifySession()
  const existing = await db.select().from(paySettings).limit(1)
  if (existing.length > 0) {
    const [updated] = await db
      .update(paySettings)
      .set({ amountPence, frequency, nextPayDate, updatedAt: new Date() })
      .where(eq(paySettings.id, existing[0].id))
      .returning()
    return updated
  }
  const [created] = await db
    .insert(paySettings)
    .values({ amountPence, frequency, nextPayDate })
    .returning()
  return created
}
