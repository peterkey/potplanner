'use client'

import { useActionState, useEffect } from 'react'
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  createSavingsGoalAction,
  updateSavingsGoalAction,
  type SavingsGoalActionState,
} from '@/app/actions/savings-goals'

interface Pot {
  id: number
  name: string
}

interface SavingsFormProps {
  goal?: {
    id: number
    name: string
    targetPence: number
    potId: number | null
  } | null
  pots: Pot[]
  onClose: () => void
}

export function SavingsForm({ goal, pots, onClose }: SavingsFormProps) {
  const action = goal ? updateSavingsGoalAction : createSavingsGoalAction
  const [state, formAction, pending] = useActionState<SavingsGoalActionState, FormData>(
    action,
    {} as SavingsGoalActionState
  )

  useEffect(() => {
    if (state.success) onClose()
  }, [state.success, onClose])

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{goal ? 'Edit savings goal' : 'Add savings goal'}</DialogTitle>
      </DialogHeader>
      <form action={formAction} className="space-y-4">
        {goal && <input type="hidden" name="id" value={goal.id} />}

        <div className="space-y-1">
          <Label htmlFor="goal-name">Goal name</Label>
          <Input
            id="goal-name"
            name="name"
            required
            defaultValue={goal?.name ?? ''}
            placeholder="e.g. Holiday fund, Emergency fund"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="goal-target">Target amount (£)</Label>
          <Input
            id="goal-target"
            name="targetPounds"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={goal ? (goal.targetPence / 100).toFixed(2) : ''}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="goal-pot">Link to pot (optional)</Label>
          <Select name="potId" defaultValue={goal?.potId?.toString() ?? 'none'}>
            <SelectTrigger id="goal-pot">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No pot</SelectItem>
              {pots.map((pot) => (
                <SelectItem key={pot.id} value={pot.id.toString()}>{pot.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : goal ? 'Save changes' : 'Add goal'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
