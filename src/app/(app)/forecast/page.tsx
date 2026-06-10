import { getIncomes } from '@/lib/dal/incomes'
import { getBillsWithSplits } from '@/lib/dal/bills'
import { getPots } from '@/lib/dal/pots'
import { getAccountsWithShares } from '@/lib/dal/accounts'
import { ForecastView } from '@/components/forecast/forecast-view'
import { PageTransition } from '@/components/page-transition'

export default async function ForecastPage() {
  const [incomes, billsWithSplits, pots, accounts] = await Promise.all([
    getIncomes(),
    getBillsWithSplits(),
    getPots(),
    getAccountsWithShares(),
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
      />
      </div>
    </PageTransition>
  )
}
