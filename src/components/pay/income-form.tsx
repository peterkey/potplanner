'use client'

import { useActionState, useEffect, useRef } from 'react'
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  createIncomeAction,
  updateIncomeAction,
  type IncomeFormState,
} from '@/app/actions/incomes'
import { PAY_FREQUENCY_LABELS, type PayFrequency } from '@/lib/engine/paycheck'

const FREQUENCIES: PayFrequency[] = ['weekly', 'biweekly', 'four_weekly', 'monthly']

function toInputDate(d: Date) {
  return new Date(d).toISOString().split('T')[0]
}

interface Income {
  id: number
  name: string
  amountPence: number
  frequency: string
  nextPayDate: Date
  memberId: number | null
}

interface Member {
  id: number
  name: string
}

interface Props {
  income?: Income | null
  members: Member[]
  onClose: () => void
}

export function IncomeForm({ income, members, onClose }: Props) {
  const action = income ? updateIncomeAction : createIncomeAction
  const [state, formAction, pending] = useActionState<IncomeFormState, FormData>(
    action,
    {} as IncomeFormState,
  )
  const actedState = useRef<typeof state | null>(null)

  useEffect(() => {
    if (state.success && state !== actedState.current) {
      actedState.current = state
      onClose()
    }
  }, [state, onClose])

  const defaultFrequency = (income?.frequency ?? 'monthly') as PayFrequency
  const defaultDate = income?.nextPayDate
    ? toInputDate(new Date(income.nextPayDate))
    : toInputDate(new Date())

  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>{income ? 'Edit income' : 'Add income'}</DialogTitle>
      </DialogHeader>

      <form action={formAction} autoComplete="off" className="space-y-4 mt-2">
        {income && <input type="hidden" name="id" value={income.id} />}

        <div>
          <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Name
          </label>
          <Input
            name="name"
            placeholder="e.g. Peter's salary"
            defaultValue={income?.name ?? ''}
            required
          />
        </div>

        <div>
          <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Take-home amount
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">£</span>
            <Input
              name="amountPounds"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              defaultValue={income ? (income.amountPence / 100).toFixed(2) : ''}
              className="pl-7 tabular-nums"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Pay frequency
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {FREQUENCIES.map((f) => (
              <label
                key={f}
                className="relative flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2.5 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors"
              >
                <input
                  type="radio"
                  name="frequency"
                  value={f}
                  defaultChecked={f === defaultFrequency}
                  className="sr-only"
                />
                <span className="text-[12px] font-medium">{PAY_FREQUENCY_LABELS[f]}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Next pay date
          </label>
          <Input name="nextPayDate" type="date" defaultValue={defaultDate} className="text-sm" />
        </div>

        {members.length > 0 && (
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Member
            </label>
            <Select name="memberId" defaultValue={income?.memberId?.toString() ?? 'none'}>
              <SelectTrigger>
                <SelectValue placeholder="No member (household)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No member (household)</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending} className="flex-1">
            {pending ? 'Saving…' : income ? 'Save changes' : 'Add income'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
