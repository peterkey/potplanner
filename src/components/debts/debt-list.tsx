'use client'

import { useState } from 'react'
import { useMember } from '@/lib/context/member-context'
import { Plus, Pencil, Trash2, TrendingDown } from 'lucide-react'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { deleteDebtAction } from '@/app/actions/debts'
import { DebtForm } from '@/components/debts/debt-form'
import { calculateAvalanche, calculateSnowball } from '@/lib/engine/debt'
import type { DebtInput, DebtPayoffPlan } from '@/lib/engine/debt'

interface Account { id: number; name: string }
interface Pot { id: number; name: string; accountId: number | null }
interface Member { id: number; name: string }

interface Debt {
  id: number
  name: string
  balancePence: number
  interestRate: number
  minimumPaymentPence: number
  paymentDueDate: Date | null
  accountId: number | null
  potId: number | null
  memberId: number | null
  createdAt: Date
}

interface DebtListProps {
  debts: Debt[]
  accounts: Account[]
  pots: Pot[]
  members: Member[]
}

function PayoffTimeline({ plan }: { plan: DebtPayoffPlan }) {
  if (plan.totalMonths === 0) {
    return <p className="text-sm text-muted-foreground">No debts to calculate.</p>
  }

  const years = Math.floor(plan.totalMonths / 12)
  const months = plan.totalMonths % 12

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Payoff time: </span>
          <span className="font-semibold">
            {years > 0 ? `${years}y ` : ''}{months > 0 ? `${months}m` : years > 0 ? '' : '0m'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Total interest: </span>
          <span className="font-semibold text-destructive">
            £{(plan.totalInterestPence / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {plan.payoffOrder.length > 0 && (
        <div className="text-sm">
          <span className="text-muted-foreground">Payoff order: </span>
          {plan.payoffOrder.map((name, i) => (
            <span key={i}>
              <Badge variant="secondary" className="mr-1">{i + 1}. {name}</Badge>
            </span>
          ))}
        </div>
      )}

      <div className="max-h-64 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Month</TableHead>
              <TableHead className="text-xs">Debt</TableHead>
              <TableHead className="text-xs">Payment</TableHead>
              <TableHead className="text-xs">Interest</TableHead>
              <TableHead className="text-xs">Remaining</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plan.timeline.map((row, i) => (
              <TableRow key={i} className={row.remainingBalancePence === 0 ? 'bg-green-50 dark:bg-green-950/20' : ''}>
                <TableCell className="text-xs py-1">{row.month}</TableCell>
                <TableCell className="text-xs py-1">{row.debtName}</TableCell>
                <TableCell className="text-xs py-1">£{(row.paymentPence / 100).toFixed(2)}</TableCell>
                <TableCell className="text-xs py-1 text-destructive">£{(row.interestPence / 100).toFixed(2)}</TableCell>
                <TableCell className="text-xs py-1">
                  {row.remainingBalancePence === 0 ? (
                    <Badge variant="success" className="text-xs">Paid off!</Badge>
                  ) : (
                    `£${(row.remainingBalancePence / 100).toFixed(2)}`
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function DebtList({ debts, accounts, pots, members }: DebtListProps) {
  const { activeMemberId } = useMember()
  const visibleDebts = activeMemberId ? debts.filter((d) => d.memberId === activeMemberId) : debts

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)

  const engineDebts: DebtInput[] = visibleDebts.map((d) => ({
    id: d.id,
    name: d.name,
    balancePence: d.balancePence,
    interestRate: d.interestRate,
    minimumPaymentPence: d.minimumPaymentPence,
  }))

  const avalanche = calculateAvalanche(engineDebts)
  const snowball = calculateSnowball(engineDebts)

  const totalBalancePence = visibleDebts.reduce((s, d) => s + d.balancePence, 0)

  if (visibleDebts.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="t-h1">Debts</h1>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add debt
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-card border border-border">
            <TrendingDown className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-sm font-semibold mb-1">No debts tracked</h2>
          <p className="text-xs text-muted-foreground mb-5 max-w-xs">
            Add your debts to calculate payoff strategies and track your progress.
          </p>
          <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
            Add debt
          </Button>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DebtForm accounts={accounts} pots={pots} members={members} onClose={() => setCreateDialogOpen(false)} />
        </Dialog>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="t-h1">Debts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Total:{' '}
            <span className="font-semibold font-money text-destructive">
              £{(totalBalancePence / 100).toFixed(2)}
            </span>
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add debt
        </Button>
      </div>

      <Table className="mb-6">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Interest rate</TableHead>
            <TableHead>Min. payment</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleDebts.map((debt) => (
            <DebtRow key={debt.id} debt={debt} onEdit={() => setEditingDebt(debt)} />
          ))}
        </TableBody>
      </Table>

      <Separator className="my-6" />

      <div>
        <h2 className="t-h2 mb-4">Payoff strategies</h2>
        <Tabs defaultValue="avalanche">
          <TabsList>
            <TabsTrigger value="avalanche">Avalanche</TabsTrigger>
            <TabsTrigger value="snowball">Snowball</TabsTrigger>
          </TabsList>
          <TabsContent value="avalanche">
            <div className="mb-3">
              <p className="text-sm text-muted-foreground">
                Highest interest rate first — minimises total interest paid.
              </p>
            </div>
            <PayoffTimeline plan={avalanche} />
          </TabsContent>
          <TabsContent value="snowball">
            <div className="mb-3">
              <p className="text-sm text-muted-foreground">
                Lowest balance first — builds momentum with quick wins.
              </p>
            </div>
            <PayoffTimeline plan={snowball} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DebtForm accounts={accounts} pots={pots} members={members} onClose={() => setCreateDialogOpen(false)} />
      </Dialog>

      <Dialog
        open={editingDebt !== null}
        onOpenChange={(open) => !open && setEditingDebt(null)}
      >
        <DebtForm key={editingDebt?.id ?? 'new'} debt={editingDebt} accounts={accounts} pots={pots} members={members} onClose={() => setEditingDebt(null)} />
      </Dialog>
    </div>
  )
}

interface DebtRowProps {
  debt: Debt
  onEdit: () => void
}

function DebtRow({ debt, onEdit }: DebtRowProps) {
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    setPending(true)
    await deleteDebtAction(debt.id)
    setPending(false)
  }

  return (
    <TableRow>
      <TableCell>{debt.name}</TableCell>
      <TableCell className="font-medium font-money">£{(debt.balancePence / 100).toFixed(2)}</TableCell>
      <TableCell>{(debt.interestRate / 100).toFixed(2)}%</TableCell>
      <TableCell className="font-money">£{(debt.minimumPaymentPence / 100).toFixed(2)}</TableCell>
      <TableCell className="text-sm">
        {debt.paymentDueDate
          ? new Date(debt.paymentDueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${debt.name}`}
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
                aria-label={`Delete ${debt.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete debt?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &ldquo;{debt.name}&rdquo;. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep debt</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={pending}>
                  {pending ? 'Deleting...' : 'Delete debt'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  )
}
