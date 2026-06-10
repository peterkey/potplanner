import 'server-only'
import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { accounts, accountShares, householdMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getAccounts() {
  await verifySession()
  return db.select().from(accounts).orderBy(accounts.createdAt)
}

export async function getAccountsWithShares() {
  await verifySession()
  const rows = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      initialBalancePence: accounts.initialBalancePence,
      ownerId: accounts.ownerId,
      ownerName: householdMembers.name,
      createdAt: accounts.createdAt,
    })
    .from(accounts)
    .leftJoin(householdMembers, eq(accounts.ownerId, householdMembers.id))
    .orderBy(accounts.createdAt)

  const shares = await db
    .select({
      accountId: accountShares.accountId,
      memberId: accountShares.memberId,
      memberName: householdMembers.name,
      defaultPercentage: accountShares.defaultPercentage,
    })
    .from(accountShares)
    .leftJoin(householdMembers, eq(accountShares.memberId, householdMembers.id))

  return rows.map((row) => ({
    ...row,
    ownerName: row.ownerName ?? null,
    shares: shares
      .filter((s) => s.accountId === row.id)
      .map((s) => ({
        memberId: s.memberId,
        memberName: s.memberName ?? '',
        defaultPercentage: s.defaultPercentage,
      })),
  }))
}

export async function createAccount(
  name: string,
  initialBalancePence: number,
  ownerId: number | null,
  shares: Array<{ memberId: number; defaultPercentage: number }>
) {
  await verifySession()
  const [account] = await db
    .insert(accounts)
    .values({ name, initialBalancePence, ownerId })
    .returning()
  if (shares.length > 0) {
    await db.insert(accountShares).values(
      shares.map((s) => ({ accountId: account.id, memberId: s.memberId, defaultPercentage: s.defaultPercentage }))
    )
  }
  return account
}

export async function updateAccount(
  id: number,
  name: string,
  initialBalancePence: number,
  ownerId: number | null,
  shares: Array<{ memberId: number; defaultPercentage: number }>
) {
  await verifySession()
  const [account] = await db
    .update(accounts)
    .set({ name, initialBalancePence, ownerId })
    .where(eq(accounts.id, id))
    .returning()
  await db.delete(accountShares).where(eq(accountShares.accountId, id))
  if (shares.length > 0) {
    await db.insert(accountShares).values(
      shares.map((s) => ({ accountId: id, memberId: s.memberId, defaultPercentage: s.defaultPercentage }))
    )
  }
  return account
}

export async function deleteAccount(id: number) {
  await verifySession()
  await db.delete(accountShares).where(eq(accountShares.accountId, id))
  await db.delete(accounts).where(eq(accounts.id, id))
}
