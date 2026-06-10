'use client'

import { useState, useMemo, type CSSProperties } from 'react'
import { Plus, Pencil, Trash2, Banknote, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { IncomeForm } from '@/components/pay/income-form'
import { useMember } from '@/lib/context/member-context'
import { deleteIncomeAction } from '@/app/actions/incomes'
import { PAY_FREQUENCY_LABELS, type PayFrequency } from '@/lib/engine/paycheck'
import { format } from 'date-fns'

function fmt(pence: number) {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface Income {
  id: number
  name: string
  amountPence: number
  frequency: string
  nextPayDate: Date
  memberId: number | null
  memberName: string | null
}

interface Member {
  id: number
  name: string
}

interface Props {
  incomes: Income[]
  members: Member[]
}

export function IncomeList({ incomes, members }: Props) {
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Income | null>(null)
  const { activeMemberId } = useMember()

  const visibleIncomes = useMemo(
    () =>
      activeMemberId === null
        ? incomes
        : incomes.filter((i) => i.memberId === activeMemberId || i.memberId === null),
    [incomes, activeMemberId],
  )

  return (
    <div className="px-8 py-8 max-w-xl">
      {/* Header */}
      <div
        className="animate-reveal-up flex items-center justify-between mb-8"
        style={{ '--delay': '0ms' } as CSSProperties}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Income</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {visibleIncomes.length === 0
              ? 'Add income sources to power your dashboard.'
              : `${visibleIncomes.length} income source${visibleIncomes.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add income
        </Button>
      </div>

      {/* Empty state */}
      {visibleIncomes.length === 0 && (
        <div
          className="animate-reveal-up flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border py-20 text-center"
          style={{ '--delay': '60ms' } as CSSProperties}
        >
          <Banknote className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-semibold mb-1">No income sources yet</p>
          <p className="text-xs text-muted-foreground mb-5 max-w-xs">
            Add a salary or income source so the dashboard can show what to transfer each pay cycle.
          </p>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            Add first income
          </Button>
        </div>
      )}

      {/* Income cards */}
      <div className="space-y-3">
        {visibleIncomes.map((income, i) => (
          <div
            key={income.id}
            className="animate-reveal-up card-elevated px-5 py-4 flex items-center gap-4"
            style={{ '--delay': `${60 + i * 40}ms` } as CSSProperties}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Banknote className="h-5 w-5 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold truncate">{income.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground">
                  {PAY_FREQUENCY_LABELS[income.frequency as PayFrequency] ?? income.frequency}
                </span>
                <span className="text-muted-foreground/40 text-[11px]">·</span>
                <span className="text-[11px] text-muted-foreground">
                  Next: {format(new Date(income.nextPayDate), 'd MMM yyyy')}
                </span>
                {income.memberName && (
                  <>
                    <span className="text-muted-foreground/40 text-[11px]">·</span>
                    <span className="flex items-center gap-1 text-[11px] text-primary font-medium">
                      <User className="h-3 w-3" />
                      {income.memberName}
                    </span>
                  </>
                )}
              </div>
            </div>

            <p className="text-[15px] font-bold tabular-nums shrink-0">{fmt(income.amountPence)}</p>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => setEditing(income)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete income?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove &ldquo;{income.name}&rdquo; from your dashboard calculations.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => deleteIncomeAction(income.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      {/* Dialogs */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <IncomeForm members={members} onClose={() => setAddOpen(false)} />
      </Dialog>
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <IncomeForm income={editing} members={members} onClose={() => setEditing(null)} />
      </Dialog>
    </div>
  )
}
