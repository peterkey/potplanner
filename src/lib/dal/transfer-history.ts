import 'server-only'
import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { transferHistory, pots, accounts } from '@/lib/db/schema'
import { desc, and, gte, lte, eq } from 'drizzle-orm'

export async function getTransferHistory(from?: Date, to?: Date) {
  await verifySession()
  const query = db
    .select()
    .from(transferHistory)
    .orderBy(desc(transferHistory.createdAt))
    .$dynamic()

  if (from && to) {
    return query.where(
      and(gte(transferHistory.createdAt, from), lte(transferHistory.createdAt, to))
    )
  }
  return query
}

export async function getMonthlySpendingByPot(year: number, month: number) {
  await verifySession()
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

  const entries = await db
    .select()
    .from(transferHistory)
    .where(
      and(
        eq(transferHistory.sourceType, 'pot'),
        gte(transferHistory.createdAt, monthStart),
        lte(transferHistory.createdAt, monthEnd)
      )
    )

  // Sum spending per pot (positive = spending, compensating entries add back)
  const byPot: Record<number, number> = {}
  for (const entry of entries) {
    if (entry.sourceId !== null) {
      byPot[entry.sourceId] = (byPot[entry.sourceId] ?? 0) + entry.amountPence
    }
  }
  // Subtract any reversals (destinationType='pot' entries reduce the pot's spending)
  const reversals = await db
    .select()
    .from(transferHistory)
    .where(
      and(
        eq(transferHistory.destinationType, 'pot'),
        gte(transferHistory.createdAt, monthStart),
        lte(transferHistory.createdAt, monthEnd)
      )
    )
  for (const entry of reversals) {
    if (entry.destinationId !== null) {
      byPot[entry.destinationId] = (byPot[entry.destinationId] ?? 0) - entry.amountPence
    }
  }

  return byPot
}

export async function getTransferHistoryWithNames(from?: Date, to?: Date) {
  await verifySession()
  const entries = await getTransferHistory(from, to)
  const allPots = await db.select({ id: pots.id, name: pots.name }).from(pots)
  const allAccounts = await db.select({ id: accounts.id, name: accounts.name }).from(accounts)

  function getName(type: string, id: number | null): string {
    if (id === null) return 'External'
    if (type === 'pot') return allPots.find((p) => p.id === id)?.name ?? 'Pot'
    if (type === 'account') return allAccounts.find((a) => a.id === id)?.name ?? 'Account'
    return 'External'
  }

  return entries.map((entry) => ({
    ...entry,
    sourceName: getName(entry.sourceType, entry.sourceId),
    destinationName: getName(entry.destinationType, entry.destinationId),
  }))
}
