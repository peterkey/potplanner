'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { deleteBillAction } from '@/app/actions/bills'
import { BillForm } from '@/components/bills/bill-form'
import { BillLogo } from '@/components/bill-logo'
import { getBillOccurrences } from '@/lib/engine/bills'
import type { Bill as EngineBill, BillFrequency } from '@/lib/engine/types'
import { useMember } from '@/lib/context/member-context'

interface Split {
  id: number
  memberId: number
  memberName: string
  percentage: number
}

interface Bill {
  id: number
  name: string
  amountPence: number
  frequency: string
  potId: number | null
  accountId: number | null
  nextDueDate: Date
  createdAt: Date
  splits: Split[]
}

interface Pot {
  id: number
  name: string
  accountId: number | null
}

interface AccountShare { memberId: number; memberName: string; defaultPercentage: number }
interface Account {
  id: number
  name: string
  ownerId: number | null
  shares: AccountShare[]
}

interface Member {
  id: number
  name: string
}

interface BillListProps {
  bills: Bill[]
  pots: Pot[]
  accounts: Account[]
  members?: Member[]
}

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  four_weekly: '4-weekly',
  monthly: 'Monthly',
  annual: 'Annual',
}

function getSourceLabel(bill: Bill, pots: Pot[], accounts: Account[]): string {
  if (bill.potId) return pots.find((p) => p.id === bill.potId)?.name ?? 'Unknown pot'
  if (bill.accountId) return accounts.find((a) => a.id === bill.accountId)?.name ?? 'Unknown account'
  return 'Unassigned'
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

export function BillList({ bills, pots, accounts, members = [] }: BillListProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const { activeMemberId } = useMember()

  const memberAccountIds = useMemo(() => {
    if (!activeMemberId) return null
    return new Set(
      accounts
        .filter((a) => a.ownerId === activeMemberId || a.shares.some((s) => s.memberId === activeMemberId))
        .map((a) => a.id)
    )
  }, [accounts, activeMemberId])

  const potAccountIdMap = useMemo(
    () => new Map(pots.map((p) => [p.id, p.accountId])),
    [pots]
  )

  const visibleBills = useMemo(() => {
    if (!memberAccountIds) return bills
    return bills.filter((bill) => {
      if (bill.splits.some((s) => s.memberId === activeMemberId)) return true
      if (bill.splits.length === 0) {
        const acctId = bill.accountId ?? (bill.potId !== null ? potAccountIdMap.get(bill.potId) ?? null : null)
        if (acctId === null) return true
        return memberAccountIds.has(acctId)
      }
      return false
    })
  }, [bills, memberAccountIds, potAccountIdMap, activeMemberId])

  const potBills = visibleBills.filter((b) => b.potId !== null)
  const accountBills = visibleBills.filter((b) => b.potId === null)
  const upcoming = getUpcomingBills(visibleBills)

  if (visibleBills.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="t-h1">Bills</h1>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add bill
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-card border border-border">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-sm font-semibold mb-1">No bills yet</h2>
          <p className="text-xs text-muted-foreground mb-5 max-w-xs">
            Add your first bill to start tracking recurring payments.
          </p>
          <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
            Add bill
          </Button>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <BillForm pots={pots} accounts={accounts} members={members} onClose={() => setCreateDialogOpen(false)} />
        </Dialog>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="t-h1">Bills</h1>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add bill
        </Button>
      </div>

      {potBills.length > 0 && (
        <div className="mb-6">
          <h2 className="t-caption uppercase tracking-widest text-muted-foreground/60 mb-3">
            Pot bills
          </h2>
          <BillTable bills={potBills} pots={pots} accounts={accounts} activeMemberId={activeMemberId} onEdit={setEditingBill} />
        </div>
      )}

      {accountBills.length > 0 && (
        <div className="mb-6">
          <h2 className="t-caption uppercase tracking-widest text-muted-foreground/60 mb-3">
            Account bills
          </h2>
          <BillTable bills={accountBills} pots={pots} accounts={accounts} activeMemberId={activeMemberId} onEdit={setEditingBill} />
        </div>
      )}

      {upcoming.length > 0 && (
        <>
          <Separator className="my-6" />
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="size-4 text-muted-foreground" />
              <h2 className="t-caption uppercase tracking-widest text-muted-foreground/60">
                Upcoming (next 30 days)
              </h2>
            </div>
            <div className="space-y-2">
              {upcoming.map(({ bill, dueDate }, i) => (
                <div
                  key={`${bill.id}-${i}`}
                  className="elevation-1 flex items-center justify-between px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <BillLogo name={bill.name} size={28} />
                    <div>
                      <p className="text-sm font-medium">{bill.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getSourceLabel(bill, pots, accounts)} · {FREQUENCY_LABELS[bill.frequency]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="t-label font-semibold font-money">£{(getMemberAmount(bill, activeMemberId) / 100).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{format(dueDate, 'd MMM yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <BillForm pots={pots} accounts={accounts} members={members} onClose={() => setCreateDialogOpen(false)} />
      </Dialog>

      <Dialog
        open={editingBill !== null}
        onOpenChange={(open) => !open && setEditingBill(null)}
      >
        <BillForm
          key={editingBill?.id ?? 'new'}
          bill={editingBill}
          pots={pots}
          accounts={accounts}
          members={members}
          onClose={() => setEditingBill(null)}
        />
      </Dialog>
    </div>
  )
}

function getMemberAmount(bill: Bill, activeMemberId: number | null): number {
  if (activeMemberId === null || bill.splits.length === 0) return bill.amountPence
  const split = bill.splits.find((s) => s.memberId === activeMemberId)
  if (!split) return bill.amountPence
  return Math.round(bill.amountPence * split.percentage / 100)
}

interface BillTableProps {
  bills: Bill[]
  pots: Pot[]
  accounts: Account[]
  activeMemberId: number | null
  onEdit: (bill: Bill) => void
}

function BillTable({ bills, pots, accounts, activeMemberId, onEdit }: BillTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Frequency</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Next due</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bills.map((bill) => (
          <BillRow key={bill.id} bill={bill} pots={pots} accounts={accounts} activeMemberId={activeMemberId} onEdit={() => onEdit(bill)} />
        ))}
      </TableBody>
    </Table>
  )
}

interface BillRowProps {
  bill: Bill
  pots: Pot[]
  accounts: Account[]
  activeMemberId: number | null
  onEdit: () => void
}

function BillRow({ bill, pots, accounts, activeMemberId, onEdit }: BillRowProps) {
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    setPending(true)
    await deleteBillAction(bill.id)
    setPending(false)
  }

  const splitSummary =
    bill.splits.length > 0
      ? bill.splits.map((s) => `${s.memberName} ${s.percentage}%`).join(' / ')
      : null

  return (
    <TableRow>
      <TableCell>
        <div>
          <p>{bill.name}</p>
          {splitSummary && (
            <p className="text-xs text-muted-foreground">{splitSummary}</p>
          )}
        </div>
      </TableCell>
      <TableCell>£{(getMemberAmount(bill, activeMemberId) / 100).toFixed(2)}</TableCell>
      <TableCell>{FREQUENCY_LABELS[bill.frequency]}</TableCell>
      <TableCell>{getSourceLabel(bill, pots, accounts)}</TableCell>
      <TableCell>{format(new Date(bill.nextDueDate), 'd MMM yyyy')}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
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
