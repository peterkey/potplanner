import { getTransferHistoryWithNames, getMonthlySpendingByPot } from '@/lib/dal/transfer-history'
import { getPots } from '@/lib/dal/pots'
import { TransferHistoryList } from '@/components/history/transfer-history-list'
import { format } from 'date-fns'

const CHART_COLORS = [
  'oklch(0.499 0.252 278.7)',
  'oklch(0.623 0.214 259.815)',
  'oklch(0.809 0.105 251.813)',
  'oklch(0.546 0.245 262.881)',
  'oklch(0.424 0.199 265.638)',
  'oklch(0.488 0.243 264.376)',
]

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
    <div className="px-6 md:px-8 py-8">
      <TransferHistoryList entries={entries} donutSlices={donutSlices} month={month} />
    </div>
  )
}
