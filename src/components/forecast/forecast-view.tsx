'use client'

import { useState, useMemo, Fragment } from 'react'
import { format, isSameMonth, isSameYear } from 'date-fns'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMember } from '@/lib/context/member-context'
import { forecastPayPeriods } from '@/lib/engine/forecast'
import { getCurrentPayWindow, getWindowEnd } from '@/lib/engine/paycheck'
import type { PayFrequency, BillFrequency, Pot, Bill, PayPeriodForecast } from '@/lib/engine/types'

function calcMonthIncome(monthIncomes: IncomeRow[], monthStart: Date): number {
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1)
  let total = 0
  for (const income of monthIncomes) {
    const freq = income.frequency as PayFrequency
    if (freq === 'monthly') {
      total += income.amountPence
    } else {
      // Walk from the current pay window start, advance to the target month, then count periods within it
      let periodStart = getCurrentPayWindow(new Date(income.nextPayDate), freq).windowStart
      while (periodStart < monthStart) {
        periodStart = getWindowEnd(periodStart, freq)
      }
      while (periodStart < monthEnd) {
        total += income.amountPence
        periodStart = getWindowEnd(periodStart, freq)
      }
    }
  }
  return total
}

const PERIODS_PER_YEAR: Record<PayFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  four_weekly: 13,
  monthly: 12,
}

interface IncomeRow {
  id: number
  name: string
  amountPence: number
  frequency: string
  nextPayDate: string
  memberId: number | null
}

interface BillWithSplits {
  id: number
  name: string
  amountPence: number
  frequency: string
  potId: number | null
  accountId: number | null
  nextDueDate: string
  splits: { memberId: number; percentage: number }[]
}

interface PotRow {
  id: number
  name: string
  allocatedPence: number
  rollover: boolean
  accountId: number | null
}

interface AccountRow {
  id: number
  ownerId: number | null
  shares: { memberId: number }[]
}

interface Props {
  incomes: IncomeRow[]
  billsWithSplits: BillWithSplits[]
  pots: PotRow[]
  accounts: AccountRow[]
}

function pence(n: number) {
  const abs = Math.abs(n) / 100
  return `${n < 0 ? '-' : ''}£${abs.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function periodLabel(startIso: string, endIso: string): string {
  const start = new Date(startIso)
  // periodEnd is the exclusive start of the next window — display one day before
  const end = new Date(new Date(endIso).getTime() - 86400000)

  if (isSameMonth(start, end) && isSameYear(start, end)) {
    return `${format(start, 'd')}–${format(end, 'd MMM yyyy')}`
  }
  if (isSameYear(start, end)) {
    return `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`
  }
  return `${format(start, 'd MMM yyyy')} – ${format(end, 'd MMM yyyy')}`
}

export function ForecastView({ incomes, billsWithSplits, pots, accounts }: Props) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const { activeMemberId } = useMember()

  const memberAccountIds = useMemo(() => {
    if (activeMemberId === null) return null
    const ids = new Set<number>()
    for (const a of accounts) {
      if (a.ownerId === activeMemberId || a.shares.some((s) => s.memberId === activeMemberId)) {
        ids.add(a.id)
      }
    }
    return ids
  }, [accounts, activeMemberId])

  const potAccountIdMap = useMemo(
    () => new Map(pots.map((p) => [p.id, p.accountId])),
    [pots],
  )

  const visibleIncomes = useMemo(() => {
    if (activeMemberId === null) return incomes
    return incomes.filter((i) => i.memberId === activeMemberId || i.memberId === null)
  }, [incomes, activeMemberId])

  const engineBills = useMemo((): Bill[] => {
    return billsWithSplits.flatMap((bill) => {
      const nextDueDate = new Date(bill.nextDueDate)
      const frequency = bill.frequency as BillFrequency

      if (activeMemberId === null) {
        return [{ id: bill.id, name: bill.name, amountPence: bill.amountPence, frequency, potId: bill.potId, accountId: bill.accountId, nextDueDate }]
      }

      if (bill.splits.length > 0) {
        const split = bill.splits.find((s) => s.memberId === activeMemberId)
        if (!split) return []
        return [{ id: bill.id, name: bill.name, amountPence: Math.round(bill.amountPence * split.percentage / 100), frequency, potId: bill.potId, accountId: bill.accountId, nextDueDate }]
      }

      const billAcctId = bill.accountId ?? (bill.potId !== null ? (potAccountIdMap.get(bill.potId) ?? null) : null)
      if (billAcctId !== null && !memberAccountIds!.has(billAcctId)) return []
      return [{ id: bill.id, name: bill.name, amountPence: bill.amountPence, frequency, potId: bill.potId, accountId: bill.accountId, nextDueDate }]
    })
  }, [billsWithSplits, activeMemberId, memberAccountIds, potAccountIdMap])

  const enginePots = useMemo((): Pot[] => {
    const filtered =
      activeMemberId === null
        ? pots
        : pots.filter((p) => p.accountId === null || memberAccountIds!.has(p.accountId))
    return filtered.map((p) => ({ id: p.id, name: p.name, allocatedPence: p.allocatedPence, rollover: p.rollover }))
  }, [pots, activeMemberId, memberAccountIds])

  const { periods, forecastFrequency } = useMemo(() => {
    if (visibleIncomes.length === 0) {
      return { periods: [], forecastFrequency: 'monthly' as PayFrequency }
    }

    const today = new Date()
    let firstPeriodStart: Date
    let freq: PayFrequency

    if (activeMemberId === null) {
      // "All members" — 12 calendar months with per-month income (accounts for months with extra pay days)
      let monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const months: PayPeriodForecast[] = []
      let cumulativeBalance = 0
      for (let i = 0; i < 12; i++) {
        const monthIncome = calcMonthIncome(visibleIncomes, monthStart)
        const [period] = forecastPayPeriods(monthStart, 'monthly', monthIncome, enginePots, engineBills, 1, cumulativeBalance)
        months.push(period)
        cumulativeBalance = period.cumulativeBalancePence
        monthStart = getWindowEnd(monthStart, 'monthly')
      }
      return { periods: months, forecastFrequency: 'monthly' as PayFrequency }
    }

    const primaryIncome = visibleIncomes[0]
    freq = primaryIncome.frequency as PayFrequency
    firstPeriodStart = getCurrentPayWindow(new Date(primaryIncome.nextPayDate), freq).windowStart

    const payPence = visibleIncomes.reduce((s, i) => s + i.amountPence, 0)
    const n = PERIODS_PER_YEAR[freq]
    const result = forecastPayPeriods(firstPeriodStart, freq, payPence, enginePots, engineBills, n)

    return { periods: result, forecastFrequency: freq }
  }, [visibleIncomes, enginePots, engineBills, activeMemberId])

  const serializedPeriods = useMemo(
    () =>
      periods.map((p) => ({
        ...p,
        periodStart: p.periodStart.toISOString(),
        periodEnd: p.periodEnd.toISOString(),
        billsDue: p.billsDue.map((b) => ({ ...b, dueDate: b.dueDate.toISOString() })),
      })),
    [periods],
  )

  const freqLabel: Record<PayFrequency, string> = {
    weekly: 'weekly',
    biweekly: 'fortnightly',
    four_weekly: '4-weekly',
    monthly: 'monthly',
  }

  if (visibleIncomes.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="t-h1">12-Month Forecast</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground text-sm">
            {activeMemberId !== null ? 'No income found for this member.' : 'No income set up yet.'}
          </p>
          {activeMemberId === null && (
            <a href="/pay" className="mt-3 text-sm text-primary hover:underline">
              Set up income →
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="t-h1">12-Month Forecast</h1>
        <p className="t-body text-muted-foreground mt-1">
          {serializedPeriods.length} {freqLabel[forecastFrequency]} pay periods · projected cash flow
        </p>
      </div>

      <Card className="elevation-1 overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle className="t-h2">Pay Period Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Period</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Pay</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Pots</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Bills</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Disposable</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Running</th>
                  <th className="w-8 px-2" />
                </tr>
              </thead>
              <tbody>
                {serializedPeriods.map((p, i) => {
                  const key = `${i}`
                  const isExpanded = expandedKey === key
                  const disposableNeg = p.disposableIncomePence < 0
                  const runningNeg = p.cumulativeBalancePence < 0

                  return (
                    <Fragment key={key}>
                      <tr
                        className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => setExpandedKey(isExpanded ? null : key)}
                      >
                        <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                          {periodLabel(p.periodStart, p.periodEnd)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-money">{pence(p.incomePence)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground font-money">
                          {p.potAllocationsPence > 0 ? `-${pence(p.potAllocationsPence)}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground font-money">
                          {p.totalBillsPence > 0 ? `-${pence(p.totalBillsPence)}` : '—'}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right tabular-nums font-medium font-money ${
                            disposableNeg ? 'text-destructive' : 'text-[var(--color-success)]'
                          }`}
                        >
                          {pence(p.disposableIncomePence)}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right tabular-nums font-money ${
                            runningNeg ? 'text-destructive' : ''
                          }`}
                        >
                          {pence(p.cumulativeBalancePence)}
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform duration-150 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${key}-detail`} className="bg-muted/20">
                          <td colSpan={7} className="px-6 py-3">
                            {p.billsDue.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No bills due this period.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {[...p.billsDue]
                                  .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                                  .map((bill, j) => (
                                    <div key={j} className="flex items-center justify-between text-sm">
                                      <span>
                                        {bill.name}
                                        <span className="text-muted-foreground ml-2">
                                          {format(new Date(bill.dueDate), 'd MMM')}
                                        </span>
                                      </span>
                                      <span className="tabular-nums font-money">{pence(bill.amountPence)}</span>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
