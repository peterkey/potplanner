'use client'

import { useActionState, useEffect, useState } from 'react'
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X } from 'lucide-react'
import {
  createSavingsGoalAction,
  updateSavingsGoalAction,
  type SavingsGoalActionState,
} from '@/app/actions/savings-goals'

interface Pot {
  id: number
  name: string
}

interface Member {
  id: number
  name: string
}

interface Contributor {
  memberId: number
  percentage: number
}

interface SavingsFormProps {
  goal?: {
    id: number
    name: string
    targetPence: number
    goalDate: Date | null
    potId: number | null
    members: Array<{ memberId: number; memberName: string; percentage: number }>
  } | null
  pots: Pot[]
  members: Member[]
  onClose: () => void
}

export function SavingsForm({ goal, pots, members, onClose }: SavingsFormProps) {
  const action = goal ? updateSavingsGoalAction : createSavingsGoalAction
  const [state, formAction, pending] = useActionState<SavingsGoalActionState, FormData>(
    action,
    {} as SavingsGoalActionState
  )

  const [selectedPotId, setSelectedPotId] = useState(goal?.potId?.toString() ?? 'none')
  const [contributors, setContributors] = useState<Contributor[]>(
    goal?.members.map((m) => ({ memberId: m.memberId, percentage: m.percentage })) ?? []
  )
  const [addingMemberId, setAddingMemberId] = useState<string>('none')
  const [addingPct, setAddingPct] = useState('')

  const goalDateDefault = goal?.goalDate
    ? new Date(goal.goalDate).toISOString().split('T')[0]
    : ''

  useEffect(() => {
    if (state.success) onClose()
  }, [state.success, onClose])

  const availableMembers = members.filter(
    (m) => !contributors.some((c) => c.memberId === m.id)
  )

  function addContributor() {
    const id = Number(addingMemberId)
    const pct = parseInt(addingPct)
    if (!id || isNaN(pct) || pct <= 0 || pct > 100) return
    setContributors((prev) => [...prev, { memberId: id, percentage: pct }])
    setAddingMemberId('none')
    setAddingPct('')
  }

  function removeContributor(memberId: number) {
    setContributors((prev) => prev.filter((c) => c.memberId !== memberId))
  }

  function getMemberName(memberId: number) {
    return members.find((m) => m.id === memberId)?.name ?? 'Unknown'
  }

  const totalPct = contributors.reduce((s, c) => s + c.percentage, 0)

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{goal ? 'Edit savings goal' : 'Add savings goal'}</DialogTitle>
      </DialogHeader>
      <form
        action={(fd) => {
          fd.set('contributors', JSON.stringify(contributors))
          formAction(fd)
        }}
        className="space-y-4"
      >
        {goal && <input type="hidden" name="id" value={goal.id} />}
        <input type="hidden" name="potId" value={selectedPotId} />

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
          <Label htmlFor="goal-date">Goal date (optional)</Label>
          <Input
            id="goal-date"
            name="goalDate"
            type="date"
            defaultValue={goalDateDefault}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Contributors */}
        <div className="space-y-2">
          <Label>Contributors</Label>

          {contributors.length > 0 && (
            <div className="space-y-1.5">
              {contributors.map((c) => (
                <div key={c.memberId} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <span className="flex-1 text-sm font-medium">{getMemberName(c.memberId)}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">{c.percentage}%</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground"
                    onClick={() => removeContributor(c.memberId)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {totalPct !== 100 && (
                <p className="text-xs text-amber-600">Percentages add up to {totalPct}% (ideally 100%)</p>
              )}
            </div>
          )}

          {availableMembers.length > 0 && (
            <div className="flex gap-2">
              <Select value={addingMemberId} onValueChange={setAddingMemberId}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select member…</SelectItem>
                  {availableMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="1"
                max="100"
                placeholder="%"
                value={addingPct}
                onChange={(e) => setAddingPct(e.target.value)}
                className="h-8 w-16 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={addContributor}
                disabled={addingMemberId === 'none' || !addingPct}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="goal-pot">Link to pot (optional)</Label>
          <Select value={selectedPotId} onValueChange={setSelectedPotId}>
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
