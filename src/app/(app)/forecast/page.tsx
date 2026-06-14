import { getIncomes } from '@/lib/dal/incomes'
import { getBillsWithSplits } from '@/lib/dal/bills'
import { getPots } from '@/lib/dal/pots'
import { getAccountsWithShares } from '@/lib/dal/accounts'
import { getDebts } from '@/lib/dal/debts'
import { ForecastView } from '@/components/forecast/forecast-view'
import { PageTransition } from '@/components/page-transition'

export default async function ForecastPage() {
  const [incomes, billsWithSplits, pots, accounts, debtRows] = await Promise.all([
    getIncomes(),
    getBillsWithSplits(),
    getPots(),
    getAccountsWithShares(),
    getDebts(),
  ])

  return (
    <PageTransition>
      <div className="px-6 md:px-8 py-8">
      <ForecastView
        incomes={incomes.map((i) => ({
          id: i.id,
          name: i.name,
          amountPence: i.amountPence,
          frequency: i.frequency,
          nextPayDate: new Date(i.nextPayDate).toISOString(),
          memberId: i.memberId ?? null,
        }))}
        billsWithSplits={billsWithSplits.map((b) => ({
          id: b.id,
          name: b.name,
          amountPence: b.amountPence,
          frequency: b.frequency,
          potId: b.potId,
          accountId: b.accountId,
          nextDueDate: new Date(b.nextDueDate).toISOString(),
          splits: b.splits.map((s) => ({ memberId: s.memberId, percentage: s.percentage })),
        }))}
        pots={pots.map((p) => ({
          id: p.id,
          name: p.name,
          allocatedPence: p.allocatedPence,
          rollover: p.rollover,
          accountId: p.accountId ?? null,
        }))}
        accounts={accounts.map((a) => ({
          id: a.id,
          ownerId: a.ownerId ?? null,
          shares: a.shares.flatMap((s) =>
            s.memberId !== null ? [{ memberId: s.memberId }] : [],
          ),
        }))}
        debts={debtRows.map((d) => ({
          id: d.id,
          name: d.name,
          minimumPaymentPence: d.minimumPaymentPence,
          paymentDueDate: d.paymentDueDate ? new Date(d.paymentDueDate).toISOString() : null,
          accountId: d.accountId ?? null,
          potId: d.potId ?? null,
          memberId: d.memberId ?? null,
        }))}
      />
      </div>
    </PageTransition>
  )
}
