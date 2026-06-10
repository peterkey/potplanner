'use client'

import { useState } from 'react'
import { useMember } from '@/lib/context/member-context'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { Plus, Pencil, Trash2, Target, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { deleteSavingsGoalAction } from '@/app/actions/savings-goals'
import { SavingsForm } from '@/components/savings/savings-form'
import { getPeriodsUntilDate, getSavingsContributionPerPeriod } from '@/lib/engine/savings'
import type { PayFrequency } from '@/lib/engine/types'

interface Pot {
  id: number
  name: string
}

interface Member {
  id: number
  name: string
}

interface GoalMember {
  memberId: number
  memberName: string
  percentage: number
}

interface SavingsGoal {
  id: number
  name: string
  targetPence: number
  goalDate: Date | null
  potId: number | null
  memberId: number | null
  createdAt: Date
  savedPence: number
  members: GoalMember[]
}

interface IncomeRow {
  memberId: number | null
  frequency: string
}

interface SavingsListProps {
  goals: SavingsGoal[]
  pots: Pot[]
  members: Member[]
  incomes: IncomeRow[]
}

function getMemberFrequency(memberId: number | null, incomes: IncomeRow[]): PayFrequency {
  const income = incomes.find((i) => i.memberId === memberId || i.memberId === null)
  return (income?.frequency ?? 'monthly') as PayFrequency
}

export function SavingsList({ goals, pots, members, incomes }: SavingsListProps) {
  const { activeMemberId } = useMember()
  const visibleGoals = activeMemberId
    ? goals.filter((g) =>
        g.members.some((m) => m.memberId === activeMemberId) ||
        (g.members.length === 0 && g.memberId === activeMemberId)
      )
    : goals

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)

  if (visibleGoals.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="t-h1">Savings Goals</h1>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add goal
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-card border border-border">
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-sm font-semibold mb-1">No savings goals yet</h2>
          <p className="text-xs text-muted-foreground mb-5 max-w-xs">
            Set a savings goal to track your progress toward financial milestones.
          </p>
          <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
            Add goal
          </Button>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <SavingsForm pots={pots} members={members} onClose={() => setCreateDialogOpen(false)} />
        </Dialog>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="t-h1">Savings Goals</h1>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add goal
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {visibleGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            pots={pots}
            incomes={incomes}
            activeMemberId={activeMemberId}
            onEdit={() => setEditingGoal(goal)}
          />
        ))}
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <SavingsForm pots={pots} members={members} onClose={() => setCreateDialogOpen(false)} />
      </Dialog>

      <Dialog
        open={editingGoal !== null}
        onOpenChange={(open) => !open && setEditingGoal(null)}
      >
        <SavingsForm
          key={editingGoal?.id ?? 'new'}
          goal={editingGoal}
          pots={pots}
          members={members}
          onClose={() => setEditingGoal(null)}
        />
      </Dialog>
    </div>
  )
}

interface GoalCardProps {
  goal: SavingsGoal
  pots: Pot[]
  incomes: IncomeRow[]
  activeMemberId: number | null
  onEdit: () => void
}

function GoalCard({ goal, pots, incomes, activeMemberId, onEdit }: GoalCardProps) {
  const [pending, setPending] = useState(false)
  const potName = pots.find((p) => p.id === goal.potId)?.name
  const pct = goal.targetPence > 0
    ? Math.min(100, Math.round((goal.savedPence / goal.targetPence) * 100))
    : 0
  const achieved = pct >= 100

  const goalDate = goal.goalDate ? new Date(goal.goalDate) : null
  const overdue = goalDate ? isPast(goalDate) && !achieved : false

  async function handleDelete() {
    setPending(true)
    await deleteSavingsGoalAction(goal.id)
    setPending(false)
  }

  // Per-period contributions: show for active member or for all members
  const contributionRows = goal.members.length > 0
    ? (activeMemberId
        ? goal.members.filter((m) => m.memberId === activeMemberId)
        : goal.members)
    : []

  return (
    <div className="elevation-1 p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{goal.name}</h3>
          {potName && (
            <p className="text-xs text-muted-foreground">Linked to: {potName}</p>
          )}
          {goalDate && (
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
              <p className={`text-xs ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                {overdue
                  ? `Overdue by ${formatDistanceToNow(goalDate)}`
                  : format(goalDate, 'd MMM yyyy')}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {achieved && <Badge variant="success">Achieved!</Badge>}
          {overdue && !achieved && <Badge variant="destructive">Overdue</Badge>}
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete goal?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &ldquo;{goal.name}&rdquo;. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep goal</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={pending}>
                  {pending ? 'Deleting...' : 'Delete goal'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="relative h-3 rounded-full overflow-hidden bg-muted">
        <div
          className="h-full rounded-full animate-progress"
          style={{ width: `${pct}%`, backgroundColor: 'var(--color-success)' }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="t-caption text-muted-foreground">{pct}% saved</span>
        <span className="t-caption font-money text-muted-foreground">
          £{(goal.savedPence / 100).toFixed(2)} / £{(goal.targetPence / 100).toFixed(2)}
        </span>
      </div>

      {/* Per-period contributions */}
      {goalDate && !achieved && contributionRows.length > 0 && (
        <div className="border-t border-border/50 pt-2.5 space-y-1">
          {contributionRows.map((c) => {
            const freq = getMemberFrequency(c.memberId, incomes)
            const periods = getPeriodsUntilDate(goalDate, freq)
            const perPeriod = getSavingsContributionPerPeriod(goal.targetPence, goal.savedPence, c.percentage, periods)
            return (
              <div key={c.memberId} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{c.memberName} ({c.percentage}%)</span>
                <span className="font-semibold font-money tabular-nums">
                  £{(perPeriod / 100).toFixed(2)}<span className="text-muted-foreground font-normal"> / pay</span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
