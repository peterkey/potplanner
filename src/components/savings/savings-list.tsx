'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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

interface Pot {
  id: number
  name: string
}

interface SavingsGoal {
  id: number
  name: string
  targetPence: number
  potId: number | null
  createdAt: Date
  savedPence: number
}

interface SavingsListProps {
  goals: SavingsGoal[]
  pots: Pot[]
}

export function SavingsList({ goals, pots }: SavingsListProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)

  if (goals.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Savings Goals</h1>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add goal
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Target className="size-10 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No savings goals yet</h2>
          <p className="text-muted-foreground mb-6">
            Set a savings goal to track your progress toward financial milestones.
          </p>
          <Button variant="ghost" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add goal
          </Button>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <SavingsForm pots={pots} onClose={() => setCreateDialogOpen(false)} />
        </Dialog>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Savings Goals</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add goal
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            pots={pots}
            onEdit={() => setEditingGoal(goal)}
          />
        ))}
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <SavingsForm pots={pots} onClose={() => setCreateDialogOpen(false)} />
      </Dialog>

      <Dialog
        open={editingGoal !== null}
        onOpenChange={(open) => !open && setEditingGoal(null)}
      >
        <SavingsForm goal={editingGoal} pots={pots} onClose={() => setEditingGoal(null)} />
      </Dialog>
    </div>
  )
}

interface GoalCardProps {
  goal: SavingsGoal
  pots: Pot[]
  onEdit: () => void
}

function GoalCard({ goal, pots, onEdit }: GoalCardProps) {
  const [pending, setPending] = useState(false)
  const potName = pots.find((p) => p.id === goal.potId)?.name
  const pct = goal.targetPence > 0
    ? Math.min(100, Math.round((goal.savedPence / goal.targetPence) * 100))
    : 0
  const achieved = pct >= 100

  async function handleDelete() {
    setPending(true)
    await deleteSavingsGoalAction(goal.id)
    setPending(false)
  }

  return (
    <div className="rounded-xl border border-border p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{goal.name}</h3>
          {potName && (
            <p className="text-xs text-muted-foreground">Linked to: {potName}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {achieved && <Badge variant="success">Achieved!</Badge>}
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

      <Progress value={pct} />

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          £{(goal.savedPence / 100).toFixed(2)} saved
        </span>
        <span className="font-medium">
          £{(goal.targetPence / 100).toFixed(2)} target ({pct}%)
        </span>
      </div>
    </div>
  )
}
