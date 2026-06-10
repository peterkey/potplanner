'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SpendingDonut } from '@/components/history/spending-donut'
import { BillLogo } from '@/components/bill-logo'

interface TransferEntry {
  id: number
  sourceType: string
  sourceId: number | null
  sourceName: string
  destinationType: string
  destinationId: number | null
  destinationName: string
  amountPence: number
  description: string | null
  createdAt: Date
}

interface SpendingSlice {
  potName: string
  amountPence: number
  color: string
}

interface TransferHistoryListProps {
  entries: TransferEntry[]
  donutSlices: SpendingSlice[]
  month: string // YYYY-MM label
}

export function TransferHistoryList({ entries, donutSlices, month }: TransferHistoryListProps) {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [filtered, setFiltered] = useState<TransferEntry[] | null>(null)

  function handleFilter() {
    if (!fromDate || !toDate) {
      setFiltered(null)
      return
    }
    const from = new Date(fromDate)
    const to = new Date(toDate)
    to.setHours(23, 59, 59, 999)
    setFiltered(entries.filter((e) => {
      const d = new Date(e.createdAt)
      return d >= from && d <= to
    }))
  }

  function handleClear() {
    setFromDate('')
    setToDate('')
    setFiltered(null)
  }

  const displayed = filtered ?? entries

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
      </div>

      {donutSlices.length > 0 && (
        <div className="mb-8 rounded-xl border border-border p-5">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Spending by pot — {month}
          </h2>
          <SpendingDonut slices={donutSlices} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="from-date">From</Label>
          <Input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to-date">To</Label>
          <Input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-40"
          />
        </div>
        <Button onClick={handleFilter} variant="outline">Filter</Button>
        {filtered && (
          <Button onClick={handleClear} variant="ghost">Clear</Button>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-lg font-semibold mb-2">No transactions yet</h2>
          <p className="text-muted-foreground">
            Transactions will appear here as they are recorded.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>From → To</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(entry.createdAt), 'd MMM yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {entry.description && !entry.description.startsWith('Reversed:') && (
                      <BillLogo name={entry.description} size={20} />
                    )}
                    <span>{entry.description ?? '—'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 text-sm">
                    <span>{entry.sourceName}</span>
                    <ArrowRight className="size-3 text-muted-foreground" />
                    <span>{entry.destinationName}</span>
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  £{(entry.amountPence / 100).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
