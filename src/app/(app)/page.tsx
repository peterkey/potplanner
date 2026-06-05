import { getAccounts } from '@/lib/dal/accounts'
import { getPots } from '@/lib/dal/pots'
import { getBills } from '@/lib/dal/bills'
import { getDebts } from '@/lib/dal/debts'
import { getMonthlySpendingByPot } from '@/lib/dal/transfer-history'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SpendingDonut } from '@/components/history/spending-donut'
import { getBillOccurrences } from '@/lib/engine/bills'
import { sumPotAllocations } from '@/lib/engine/pots'
import type { Bill as EngineBill, BillFrequency } from '@/lib/engine/types'
import { format } from 'date-fns'

const CHART_COLORS = [
  'oklch(0.499 0.252 278.7)',
  'oklch(0.623 0.214 259.815)',
  'oklch(0.809 0.105 251.813)',
  'oklch(0.546 0.245 262.881)',
  'oklch(0.424 0.199 265.638)',
  'oklch(0.488 0.243 264.376)',
]

export default async function DashboardPage() {
  const now = new Date()
  const [accounts, pots, bills, debts, spendingByPot] = await Promise.all([
    getAccounts(),
    getPots(),
    getBills(),
    getDebts(),
    getMonthlySpendingByPot(now.getFullYear(), now.getMonth() + 1),
  ])

  // Total account balance
  const totalAccountBalancePence = accounts.reduce((s, a) => s + a.initialBalancePence, 0)

  // Total pot allocation
  const totalAllocatedPence = sumPotAllocations(
    pots.map((p) => ({ id: p.id, name: p.name, allocatedPence: p.allocatedPence, rollover: p.rollover }))
  )

  // Upcoming bills (next 7 days)
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)
  weekEnd.setHours(23, 59, 59, 999)
  const todayMidnight = new Date(now)
  todayMidnight.setHours(0, 0, 0, 0)

  const upcomingBills: Array<{ name: string; amountPence: number; dueDate: Date; isPaid: boolean }> = []
  for (const bill of bills) {
    const engineBill: EngineBill = {
      id: bill.id,
      name: bill.name,
      amountPence: bill.amountPence,
      frequency: bill.frequency as BillFrequency,
      potId: bill.potId,
      nextDueDate: new Date(bill.nextDueDate),
    }
    const dates = getBillOccurrences(engineBill, todayMidnight, weekEnd)
    for (const dueDate of dates) {
      upcomingBills.push({ name: bill.name, amountPence: bill.amountPence, dueDate, isPaid: bill.isPaid })
    }
  }
  upcomingBills.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())

  // Donut chart
  const donutSlices = pots
    .filter((p) => (spendingByPot[p.id] ?? 0) > 0)
    .map((p, i) => ({
      potName: p.name,
      amountPence: spendingByPot[p.id] ?? 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))

  // Total debt
  const totalDebtPence = debts.reduce((s, d) => s + d.balancePence, 0)

  // Paid bills this month count
  const paidBillsCount = bills.filter((b) => b.isPaid).length
  const totalBillsCount = bills.length

  return (
    <div className="px-6 md:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{format(now, 'MMMM yyyy')}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-normal">Total balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">£{(totalAccountBalancePence / 100).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-normal">Pot allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">£{(totalAllocatedPence / 100).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">{pots.length} pot{pots.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-normal">Bills this month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{paidBillsCount}/{totalBillsCount}</p>
            <p className="text-xs text-muted-foreground mt-1">paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-normal">Total debt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {totalDebtPence > 0 ? `£${(totalDebtPence / 100).toFixed(2)}` : '£0.00'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{debts.length} debt{debts.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pot health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pot summary</CardTitle>
          </CardHeader>
          <CardContent>
            {pots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pots created yet.</p>
            ) : (
              <div className="space-y-2">
                {pots.map((pot) => {
                  const spent = spendingByPot[pot.id] ?? 0
                  const balance = pot.allocatedPence - spent
                  return (
                    <div key={pot.id} className="flex items-center justify-between">
                      <span className="text-sm">{pot.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${balance < 0 ? 'text-destructive' : ''}`}>
                          £{(balance / 100).toFixed(2)}
                        </span>
                        {balance < 0 && <Badge variant="destructive" className="text-xs">Over</Badge>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending this month</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingDonut slices={donutSlices} />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming bills */}
      {upcomingBills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Due this week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingBills.map((bill, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <span className={`text-sm ${bill.isPaid ? 'line-through text-muted-foreground' : ''}`}>
                      {bill.name}
                    </span>
                    {bill.isPaid && <Badge variant="success" className="ml-2 text-xs">Paid</Badge>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">£{(bill.amountPence / 100).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{format(bill.dueDate, 'd MMM')}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debt overview */}
      {debts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Debt overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {debts.map((debt) => (
                <div key={debt.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm">{debt.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {(debt.interestRate / 100).toFixed(1)}% APR
                    </span>
                  </div>
                  <span className="text-sm font-medium">£{(debt.balancePence / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
