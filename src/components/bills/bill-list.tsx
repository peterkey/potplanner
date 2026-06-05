'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Pencil, Trash2, Check, X, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Dialog } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { deleteBillAction, markBillPaidAction, markBillUnpaidAction } from '@/app/actions/bills'
import { BillForm } from '@/components/bills/bill-form'
import { BillLogo } from '@/components/bill-logo'
import { getBillOccurrences } from '@/lib/engine/bills'
import type { Bill as EngineBill, BillFrequency } from '@/lib/engine/types'

interface Split {
  id: number
  memberName: string
  percentage: number
}

interface Bill {
  id: number
  name: string
  amountPence: number
  frequency: string
  potId: number | null
  nextDueDate: Date
  isPaid: boolean
  createdAt: Date
  splits: Split[]
}

interface Pot {
  id: number
  name: string
}

interface BillListProps {
  bills: Bill[]
  pots: Pot[]
}

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  four_weekly: '4-weekly',
  monthly: 'Monthly',
  annual: 'Annual',
}

function getPotName(potId: number | null, pots: Pot[]): string {
  if (!potId) return 'Potless'
  return pots.find((p) => p.id === potId)?.name ?? 'Unknown'
}

function getUpcomingBills(bills: Bill[], days = 30) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(today)
  end.setDate(end.getDate() + days)
  end.setHours(23, 59, 59, 999)

  const upcoming: Array<{ bill: Bill; dueDate: Date }> = []
  for (const bill of bills) {
    const engineBill: EngineBill = {
      id: bill.id,
      name: bill.name,
      amountPence: bill.amountPence,
      frequency: bill.frequency as BillFrequency,
      potId: bill.potId,
      nextDueDate: new Date(bill.nextDueDate),
    }
    const dates = getBillOccurrences(engineBill, today, end)
    for (const dueDate of dates) {
      upcoming.push({ bill, dueDate })
    }
  }
  return upcoming.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
}

export function BillList({ bills, pots }: BillListProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)

  const potBills = bills.filter((b) => b.potId !== null)
  const potlessBills = bills.filter((b) => b.potId === null)
  const upcoming = getUpcomingBills(bills)

  if (bills.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Bills</h1>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add bill
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-lg font-semibold mb-2">No bills yet</h2>
          <p className="text-muted-foreground mb-6">
            Add your first bill to start tracking recurring payments.
          </p>
          <Button variant="ghost" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add bill
          </Button>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <BillForm pots={pots} onClose={() => setCreateDialogOpen(false)} />
        </Dialog>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Bills</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add bill
        </Button>
      </div>

      {potBills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Pot bills
          </h2>
          <BillTable bills={potBills} pots={pots} onEdit={setEditingBill} />
        </div>
      )}

      {potlessBills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Potless bills
          </h2>
          <BillTable bills={potlessBills} pots={pots} onEdit={setEditingBill} />
        </div>
      )}

      {upcoming.length > 0 && (
        <>
          <Separator className="my-6" />
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Upcoming (next 30 days)
              </h2>
            </div>
            <div className="space-y-2">
              {upcoming.map(({ bill, dueDate }, i) => (
                <div
                  key={`${bill.id}-${i}`}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <BillLogo name={bill.name} size={28} />
                    <div>
                      <p className="text-sm font-medium">{bill.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getPotName(bill.potId, pots)} · {FREQUENCY_LABELS[bill.frequency]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">£{(bill.amountPence / 100).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{format(dueDate, 'd MMM yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <BillForm pots={pots} onClose={() => setCreateDialogOpen(false)} />
      </Dialog>

      <Dialog
        open={editingBill !== null}
        onOpenChange={(open) => !open && setEditingBill(null)}
      >
        <BillForm
          bill={editingBill}
          pots={pots}
          onClose={() => setEditingBill(null)}
        />
      </Dialog>
    </div>
  )
}

interface BillTableProps {
  bills: Bill[]
  pots: Pot[]
  onEdit: (bill: Bill) => void
}

function BillTable({ bills, pots, onEdit }: BillTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Frequency</TableHead>
          <TableHead>Pot</TableHead>
          <TableHead>Next due</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bills.map((bill) => (
          <BillRow key={bill.id} bill={bill} pots={pots} onEdit={() => onEdit(bill)} />
        ))}
      </TableBody>
    </Table>
  )
}

interface BillRowProps {
  bill: Bill
  pots: Pot[]
  onEdit: () => void
}

function BillRow({ bill, pots, onEdit }: BillRowProps) {
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    setPending(true)
    await deleteBillAction(bill.id)
    setPending(false)
  }

  async function handleTogglePaid() {
    setPending(true)
    if (bill.isPaid) {
      await markBillUnpaidAction(bill.id)
    } else {
      await markBillPaidAction(bill.id)
    }
    setPending(false)
  }

  const splitSummary =
    bill.splits.length > 0
      ? bill.splits.map((s) => `${s.memberName} ${s.percentage}%`).join(' / ')
      : null

  return (
    <TableRow className={bill.isPaid ? 'opacity-60' : ''}>
      <TableCell>
        <div>
          <p className={bill.isPaid ? 'line-through' : ''}>{bill.name}</p>
          {splitSummary && (
            <p className="text-xs text-muted-foreground">{splitSummary}</p>
          )}
        </div>
      </TableCell>
      <TableCell>£{(bill.amountPence / 100).toFixed(2)}</TableCell>
      <TableCell>{FREQUENCY_LABELS[bill.frequency]}</TableCell>
      <TableCell>{getPotName(bill.potId, pots)}</TableCell>
      <TableCell>{format(new Date(bill.nextDueDate), 'd MMM yyyy')}</TableCell>
      <TableCell>
        {bill.isPaid ? (
          <Badge variant="success">Paid</Badge>
        ) : (
          <Badge variant="outline">Due</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={bill.isPaid ? 'Mark unpaid' : 'Mark paid'}
            onClick={handleTogglePaid}
            disabled={pending}
            className={bill.isPaid ? '' : 'text-green-600'}
          >
            {bill.isPaid ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${bill.name}`}
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                aria-label={`Delete ${bill.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete bill?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &ldquo;{bill.name}&rdquo;. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep bill</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={pending}>
                  {pending ? 'Deleting...' : 'Delete bill'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  )
}
