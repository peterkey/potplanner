import { getPots } from '@/lib/dal/pots'
import { getBillsWithSplits } from '@/lib/dal/bills'
import { getDebts } from '@/lib/dal/debts'
import { getAccountsWithShares } from '@/lib/dal/accounts'
import { getIncomes } from '@/lib/dal/incomes'
import { getSavingsGoals, getSavingsGoalProgress } from '@/lib/dal/savings-goals'
import { DashboardView } from '@/components/dashboard/dashboard-view'
import { PageTransition } from '@/components/page-transition'
import { Banknote, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { CSSProperties } from 'react'

export default async function DashboardPage() {
  const [accounts, pots, billsWithSplits, debts, incomes, goals] = await Promise.all([
    getAccountsWithShares(),
    getPots(),
    getBillsWithSplits(),
    getDebts(),
    getIncomes(),
    getSavingsGoals(),
  ])

  const savingsGoals = await Promise.all(
    goals.map(async (g) => ({
      ...g,
      savedPence: await getSavingsGoalProgress(g.id, g.potId),
    }))
  )

  if (incomes.length === 0) {
    return (
      <PageTransition>
      <div className="px-8 py-8 max-w-2xl">
        <div className="animate-reveal-up mb-6" style={{ '--delay': '0ms' } as CSSProperties}>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
        </div>
        <div
          className="animate-reveal-up card-elevated p-8 text-center"
          style={{ '--delay': '60ms' } as CSSProperties}
        >
          <Banknote size={36} className="mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-base font-semibold mb-1">Set up your income</p>
          <p className="text-sm text-muted-foreground mb-5">
            Add an income source so the dashboard can show exactly what to transfer into each pot
            each pay cycle.
          </p>
          <Link
            href="/pay"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Add income <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
    <DashboardView
      billsWithSplits={billsWithSplits.map((b) => ({
        ...b,
        nextDueDate: new Date(b.nextDueDate).toISOString(),
      }))}
      pots={pots.map((p) => ({ id: p.id, name: p.name, accountId: p.accountId ?? null }))}
      accounts={accounts.map((a) => ({
        id: a.id,
        name: a.name,
        ownerId: a.ownerId,
        shares: a.shares.map((s) => ({ memberId: s.memberId })),
      }))}
      debts={debts.map((d) => ({
        ...d,
        paymentDueDate: d.paymentDueDate ? new Date(d.paymentDueDate).toISOString() : null,
      }))}
      incomes={incomes.map((i) => ({
        id: i.id,
        name: i.name,
        amountPence: i.amountPence,
        frequency: i.frequency,
        nextPayDate: new Date(i.nextPayDate).toISOString(),
        memberId: i.memberId ?? null,
      }))}
      savingsGoals={savingsGoals.map((g) => ({
        id: g.id,
        name: g.name,
        targetPence: g.targetPence,
        savedPence: g.savedPence,
        goalDate: g.goalDate ? new Date(g.goalDate).toISOString() : null,
        members: g.members,
      }))}
    />
    </PageTransition>
  )
}
