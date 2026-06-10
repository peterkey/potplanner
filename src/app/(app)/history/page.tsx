import { getTransferHistoryWithNames, getMonthlySpendingByPot } from '@/lib/dal/transfer-history'
import { getPots } from '@/lib/dal/pots'
import { TransferHistoryList } from '@/components/history/transfer-history-list'
import { PageTransition } from '@/components/page-transition'
import { format } from 'date-fns'

const CHART_COLORS = ['#FF3B30', '#00B9A9', '#FFC800', '#14233C', '#E8634A', '#3EC9BA']

export default async function HistoryPage() {
  const now = new Date()
  const [entries, spendingByPot, allPots] = await Promise.all([
    getTransferHistoryWithNames(),
    getMonthlySpendingByPot(now.getFullYear(), now.getMonth() + 1),
    getPots(),
  ])

  const donutSlices = allPots
    .filter((p) => (spendingByPot[p.id] ?? 0) > 0)
    .map((p, i) => ({
      potName: p.name,
      amountPence: spendingByPot[p.id] ?? 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))

  const month = format(now, 'MMMM yyyy')

  return (
    <PageTransition>
      <div className="px-6 md:px-8 py-8">
        <TransferHistoryList entries={entries} donutSlices={donutSlices} month={month} />
      </div>
    </PageTransition>
  )
}
