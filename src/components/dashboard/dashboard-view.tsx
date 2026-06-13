'use client'

import { useMember } from '@/lib/context/member-context'
import { calculatePayWindowAllocations, getCurrentPayWindow, getWindowEnd, type PayFrequency, type Account, type Pot } from '@/lib/engine/paycheck'
import type { Bill as EngineBill, BillFrequency } from '@/lib/engine/types'
import { getPeriodsUntilDate, getSavingsContributionPerPeriod } from '@/lib/engine/savings'
import { format, endOfMonth } from 'date-fns'
import { Banknote, CreditCard, PiggyBank, Receipt, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '@/components/motion'
import { KpiCard } from '@/components/ui/kpi-card'

const ACCOUNT_COLORS = ['#FF3B30', '#00B9A9', '#FFC800', '#14233C', '#E8634A', '#3EC9BA']
const POT_ACCENTS = [
  { bar: '#FF3B30', bg: '#FFF0EE', text: '#B80A00' },  // Coral
  { bar: '#00B9A9', bg: '#E6F8F6', text: '#007870' },  // Teal
  { bar: '#FFC800', bg: '#FFF9E0', text: '#8A6B00' },  // Amber
  { bar: '#14233C', bg: '#EEF1F8', text: '#14233C' },  // Navy
  { bar: '#E8634A', bg: '#FEF2EE', text: '#B84225' },  // Coral warm
  { bar: '#3EC9BA', bg: '#EAFAF8', text: '#1A8075' },  // Teal light
  { bar: '#FFD340', bg: '#FFFCE8', text: '#8A7000' },  // Amber light
  { bar: '#5B8AC5', bg: '#EEF4FB', text: '#2D5F94' },  // Slate blue
]

function fmt(pence: number) {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface Split {
  id: number
  memberId: number
  memberName: string
  percentage: number
}

interface BillWithSplits {
  id: number
  name: string
  amountPence: number
  frequency: string
  potId: number | null
  accountId: number | null
  nextDueDate: string
  splits: Split[]
}

interface DebtRow {
  id: number
  name: string
  balancePence: number
  interestRate: number
  minimumPaymentPence: number
  accountId: number | null
  potId: number | null
  paymentDueDate: string | null
  memberId: number | null
}

interface PotRow {
  id: number
  name: string
  accountId: number | null
}

interface AccountRow {
  id: number
  name: string
  ownerId: number | null
  shares: Array<{ memberId: number }>
}

interface IncomeRow {
  id: number
  name: string
  amountPence: number
  frequency: string
  nextPayDate: string
  memberId: number | null
}

interface SavingsGoalRow {
  id: number
  name: string
  targetPence: number
  savedPence: number
  goalDate: string | null
  members: Array<{ memberId: number; memberName: string; percentage: number }>
}

interface DashboardViewProps {
  billsWithSplits: BillWithSplits[]
  pots: PotRow[]
  accounts: AccountRow[]
  debts: DebtRow[]
  incomes: IncomeRow[]
  savingsGoals: SavingsGoalRow[]
}

export function DashboardView({ billsWithSplits, pots, accounts, debts, incomes, savingsGoals }: DashboardViewProps) {
  const { activeMemberId } = useMember()

  // Incomes visible to the active member: member-specific ones + unlinked (household) ones
  const visibleIncomes = activeMemberId
    ? incomes.filter((i) => i.memberId === activeMemberId || i.memberId === null)
    : incomes

  const payPence = visibleIncomes.reduce((s, i) => s + i.amountPence, 0)

  const today = new Date()
  let windowStart: Date
  let frequency: string

  let windowEnd: Date

  if (activeMemberId === null) {
    // All members: current calendar month — use endOfMonth (23:59:59.999) so the 1st of
    // next month is not included (getBillOccurrences is inclusive on both ends)
    windowStart = new Date(today.getFullYear(), today.getMonth(), 1)
    frequency = 'monthly'
    windowEnd = endOfMonth(windowStart)
  } else {
    // Specific member: current pay period based on their first income (primary)
    const primaryIncome = visibleIncomes[0]
    frequency = primaryIncome.frequency
    windowStart = getCurrentPayWindow(new Date(primaryIncome.nextPayDate), frequency as PayFrequency).windowStart
    windowEnd = getWindowEnd(windowStart, frequency as PayFrequency)
  }

  const memberAccountIds = activeMemberId !== null
    ? new Set(
        accounts
          .filter((a) => a.ownerId === activeMemberId || a.shares.some((s) => s.memberId === activeMemberId))
          .map((a) => a.id)
      )
    : null

  const potAccountIdMap = new Map(pots.map((p) => [p.id, p.accountId]))

  // Apply member filter: adjust bill amounts to member's share, exclude bills outside member's accounts
  const memberBills: EngineBill[] = billsWithSplits.flatMap((bill) => {
    if (activeMemberId === null) {
      return [{
        id: bill.id, name: bill.name, amountPence: bill.amountPence,
        frequency: bill.frequency as BillFrequency, potId: bill.potId, accountId: bill.accountId,
        nextDueDate: new Date(bill.nextDueDate),
      }]
    }
    if (bill.splits.length > 0) {
      const split = bill.splits.find((s) => s.memberId === activeMemberId)
      if (!split) return []
      return [{
        id: bill.id, name: bill.name,
        amountPence: Math.round(bill.amountPence * split.percentage / 100),
        frequency: bill.frequency as BillFrequency, potId: bill.potId, accountId: bill.accountId,
        nextDueDate: new Date(bill.nextDueDate),
      }]
    }
    // No splits: only include if the bill lives in the member's account (or is floating)
    const acctId = bill.accountId ?? (bill.potId !== null ? potAccountIdMap.get(bill.potId) ?? null : null)
    if (acctId !== null && !memberAccountIds!.has(acctId)) return []
    return [{
      id: bill.id, name: bill.name, amountPence: bill.amountPence,
      frequency: bill.frequency as BillFrequency, potId: bill.potId, accountId: bill.accountId,
      nextDueDate: new Date(bill.nextDueDate),
    }]
  })

  // Filter debts by member when a member is selected
  const visibleDebts = activeMemberId
    ? debts.filter((d) => d.memberId === activeMemberId)
    : debts

  const linkedDebts = visibleDebts.filter((d) => d.accountId !== null || d.potId !== null)
  const debtBills: EngineBill[] = linkedDebts.map((d) => ({
    id: -(d.id),
    name: `${d.name} (min. payment)`,
    amountPence: d.minimumPaymentPence,
    frequency: 'monthly' as BillFrequency,
    potId: d.potId,
    accountId: d.accountId,
    nextDueDate: d.paymentDueDate ? new Date(d.paymentDueDate) : new Date(windowStart),
  }))

  const engineBills = [...memberBills, ...debtBills]
  const engineAccounts: Account[] = accounts.map((a) => ({ id: a.id, name: a.name }))
  const enginePots: Pot[] = pots.map((p) => ({ id: p.id, name: p.name, accountId: p.accountId }))

  const allocation = calculatePayWindowAllocations(windowStart, frequency as PayFrequency, engineAccounts, enginePots, engineBills, windowEnd)

  const totalDebtPence = visibleDebts.reduce((s, d) => s + d.balancePence, 0)

  // Savings commitments for this member's dashboard
  const memberFrequency = (visibleIncomes[0]?.frequency ?? 'monthly') as PayFrequency
  const savingsCommitments = savingsGoals
    .filter((g) => g.goalDate !== null)
    .flatMap((g) => {
      const goalDate = new Date(g.goalDate!)
      const periods = getPeriodsUntilDate(goalDate, memberFrequency)
      if (activeMemberId !== null) {
        const contrib = g.members.find((m) => m.memberId === activeMemberId)
        if (!contrib) return []
        const perPeriod = getSavingsContributionPerPeriod(g.targetPence, g.savedPence, contrib.percentage, periods)
        if (perPeriod <= 0) return []
        return [{ id: g.id, name: g.name, perPeriodPence: perPeriod, goalDate }]
      }
      // All members: sum all contributors' per-period amounts
      const total = g.members.reduce((s, m) => {
        return s + getSavingsContributionPerPeriod(g.targetPence, g.savedPence, m.percentage, periods)
      }, 0)
      if (total <= 0) return []
      return [{ id: g.id, name: g.name, perPeriodPence: total, goalDate }]
    })

  // Count bills relevant to active member (mirrors memberBills filtering above)
  const memberBillRecords = activeMemberId
    ? billsWithSplits.filter((b) => {
        if (b.splits.some((s) => s.memberId === activeMemberId)) return true
        if (b.splits.length === 0) {
          const acctId = b.accountId ?? (b.potId !== null ? potAccountIdMap.get(b.potId) ?? null : null)
          if (acctId === null) return true
          return memberAccountIds!.has(acctId)
        }
        return false
      })
    : billsWithSplits

  const remaining = payPence - allocation.totalNeededPence
  const isShort = remaining < 0
  const commitPct = payPence > 0 ? Math.min(100, (allocation.totalNeededPence / payPence) * 100) : 0

  const allPotsOrdered = [
    ...allocation.accountAllocations.flatMap((a) => a.pots),
    ...allocation.unassignedPots,
  ]
  const potAccentMap = new Map(allPotsOrdered.map((p, i) => [p.potId, POT_ACCENTS[i % POT_ACCENTS.length]]))

  if (visibleIncomes.length === 0) {
    return (
      <div className="px-4 sm:px-8 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
        </div>
        <div className="elevation-1 p-8 text-center">
          <p className="text-sm font-semibold mb-1">No income for this member</p>
          <p className="text-sm text-muted-foreground">
            Switch to &ldquo;All members&rdquo; or add an income source for this member on the Income page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="px-4 sm:px-8 py-8 max-w-2xl">

      {/* KPI cards */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3 mb-6">
        <KpiCard
          label="Take-home"
          value={fmt(payPence)}
          sub={`${visibleIncomes.length} income source${visibleIncomes.length !== 1 ? 's' : ''}`}
          intent="default"
          icon={<Banknote size={14} />}
        />
        <KpiCard
          label="Committed"
          value={fmt(allocation.totalNeededPence)}
          sub={`${commitPct.toFixed(0)}% of income`}
          intent={commitPct > 95 ? 'warning' : 'default'}
          icon={<PiggyBank size={14} />}
        />
        <KpiCard
          label="Bills this period"
          value={String(memberBillRecords.length)}
          sub={`${memberBillRecords.length === 1 ? '1 bill' : memberBillRecords.length + ' bills'}`}
          intent="default"
          icon={<Receipt size={14} />}
        />
        <KpiCard
          label="Savings goals"
          value={String(savingsGoals.length)}
          sub={`${savingsCommitments.length} active goal${savingsCommitments.length !== 1 ? 's' : ''}`}
          intent={savingsCommitments.length > 0 ? 'success' : 'default'}
          icon={<Target size={14} />}
        />
      </motion.div>

      {/* Pay period header */}
      <motion.div variants={staggerItem}>
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-6 text-white mb-5"
          style={{
            background: '#14233C',
            boxShadow: '0 8px 28px rgba(20, 35, 60, 0.22)',
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-3"
            style={{ color: 'rgba(255,255,255,0.50)' }}>
            {activeMemberId === null
              ? `Current month · ${format(today, 'MMMM yyyy')}`
              : `Pay period · ${format(windowStart, 'd MMM')} → ${format(windowEnd, 'd MMM yyyy')}`}
          </p>

          <p className="text-[clamp(1.625rem,8vw,2.375rem)] font-bold tabular-nums leading-none tracking-tight mb-1">
            {fmt(allocation.totalNeededPence)}
          </p>
          <p className="text-[13px] mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>needed in pots this cycle</p>

          <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <div
              className="h-full rounded-full animate-progress"
              style={{ width: `${commitPct}%`, background: '#FF3B30' }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex flex-col rounded-xl px-4 py-2.5 min-w-[100px]"
              style={{ background: 'rgba(255,255,255,0.09)' }}>
              <span className="text-[10px] font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.50)' }}>Take-home</span>
              <span className="text-[15px] font-bold tabular-nums">{fmt(payPence)}</span>
            </div>
            <div className="flex flex-col rounded-xl px-4 py-2.5 min-w-[100px]"
              style={{ background: 'rgba(255,255,255,0.09)' }}>
              <span className="text-[10px] font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.50)' }}>
                {isShort ? 'Shortfall' : 'Left over'}
              </span>
              <span className="text-[15px] font-bold tabular-nums"
                style={{ color: isShort ? '#FF6B5E' : '#3EC9BA' }}>
                {fmt(Math.abs(remaining))}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* No bills in window */}
      {allocation.totalNeededPence === 0 && (
        <motion.div variants={staggerItem}>
          <div className="elevation-1 p-6 text-center mb-4">
            <p className="text-sm text-muted-foreground">No bills fall in this pay period.</p>
          </div>
        </motion.div>
      )}

      {/* Account → Pot → Bills */}
      {allocation.accountAllocations
        .filter((acct) => acct.totalPence > 0)
        .map((acct, acctIdx) => {
        const color = ACCOUNT_COLORS[acctIdx % ACCOUNT_COLORS.length]
        return (
          <motion.div
            key={acct.accountId}
            variants={staggerItem}
            className="elevation-1 mb-4 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderLeft: `4px solid ${color}` }}>
              <div className="flex items-center gap-2.5">
                <CreditCard size={14} style={{ color }} />
                <p className="text-[13px] font-bold">{acct.accountName}</p>
              </div>
              <p className="text-[13px] font-bold tabular-nums">{fmt(acct.totalPence)}</p>
            </div>

            <div className="border-t border-border/40 divide-y divide-border/20">
              {acct.pots.filter((pot) => pot.totalPence > 0).map((pot) => {
                const accent = potAccentMap.get(pot.potId) ?? POT_ACCENTS[0]
                return (
                  <div key={pot.potId} className="bg-muted/30">
                    <div className="flex items-center justify-between px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <PiggyBank size={12} style={{ color: accent.bar }} />
                        <p className="text-[12px] font-semibold" style={{ color: accent.text }}>{pot.potName}</p>
                      </div>
                      <p className="text-[14px] font-bold tabular-nums" style={{ color: accent.text }}>
                        {fmt(pot.totalPence)}
                      </p>
                    </div>
                    {pot.bills.length > 0 && (
                      <div className="pb-2 px-5 space-y-1">
                        {pot.bills.map((bill, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Receipt size={10} className="shrink-0" />
                              <span>{bill.name}</span>
                              <span className="opacity-50">· {format(bill.dueDate, 'd MMM')}</span>
                            </div>
                            <span className="tabular-nums font-medium text-foreground/70">{fmt(bill.amountPence)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {acct.directBills.length > 0 && (
                <div className="px-5 py-2.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Receipt size={11} className="text-muted-foreground/60" />
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Direct bills</p>
                  </div>
                  <div className="space-y-1">
                    {acct.directBills.map((bill, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Receipt size={10} className="shrink-0" />
                          <span>{bill.name}</span>
                          <span className="opacity-50">· {format(bill.dueDate, 'd MMM')}</span>
                        </div>
                        <span className="tabular-nums font-medium text-foreground/70">{fmt(bill.amountPence)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )
      })}

      {/* Unassigned pots */}
      {allocation.unassignedPots.filter((p) => p.totalPence > 0).length > 0 && (
        <motion.div variants={staggerItem}>
          <div className="elevation-1 mb-4 overflow-hidden">
            <div className="px-5 py-3.5 border-l-4 border-l-muted-foreground/30">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Unassigned pots</p>
            </div>
            <div className="border-t border-border/40 divide-y divide-border/20">
              {allocation.unassignedPots.filter((p) => p.totalPence > 0).map((pot) => {
                const accent = potAccentMap.get(pot.potId) ?? POT_ACCENTS[0]
                return (
                  <div key={pot.potId} className="flex items-center justify-between px-5 py-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <PiggyBank size={12} style={{ color: accent.bar }} />
                      <p className="text-[12px] font-semibold" style={{ color: accent.text }}>{pot.potName}</p>
                    </div>
                    <p className="text-[14px] font-bold tabular-nums" style={{ color: accent.text }}>{fmt(pot.totalPence)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Unlinked bills */}
      {allocation.unlinkedBills.length > 0 && (
        <motion.div variants={staggerItem}>
          <div className="elevation-1 mb-4 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">Bills with no pot</p>
            <div className="space-y-2">
              {allocation.unlinkedBills.map((bill, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Receipt size={13} className="text-muted-foreground shrink-0" />
                    <span>{bill.name}</span>
                    <span className="text-muted-foreground text-xs">· {format(bill.dueDate, 'd MMM')}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{fmt(bill.amountPence)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Savings commitments */}
      {savingsCommitments.length > 0 && (
        <motion.div variants={staggerItem}>
          <div className="elevation-1 p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Target size={13} className="text-muted-foreground/60" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Savings this period</p>
            </div>
            <div className="space-y-2.5">
              {savingsCommitments.map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">by {format(s.goalDate, 'd MMM yyyy')}</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-success)' }}>{fmt(s.perPeriodPence)}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Debts */}
      {totalDebtPence > 0 && (
        <motion.div variants={staggerItem}>
          <div className="elevation-1 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">Debts</p>
            <div className="space-y-2.5">
              {visibleDebts.map((debt) => (
                <div key={debt.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{debt.name}</p>
                    <p className="text-[11px] text-muted-foreground">{(debt.interestRate / 100).toFixed(1)}% APR</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums text-destructive">{fmt(debt.balancePence)}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
