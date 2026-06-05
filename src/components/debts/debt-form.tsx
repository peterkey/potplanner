'use client'

import { useActionState, useEffect } from 'react'
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createDebtAction, updateDebtAction, type DebtActionState } from '@/app/actions/debts'

interface DebtFormProps {
  debt?: {
    id: number
    name: string
    balancePence: number
    interestRate: number
    minimumPaymentPence: number
  } | null
  onClose: () => void
}

export function DebtForm({ debt, onClose }: DebtFormProps) {
  const action = debt ? updateDebtAction : createDebtAction
  const [state, formAction, pending] = useActionState<DebtActionState, FormData>(
    action,
    {} as DebtActionState
  )

  useEffect(() => {
    if (state.success) onClose()
  }, [state.success, onClose])

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{debt ? 'Edit debt' : 'Add debt'}</DialogTitle>
      </DialogHeader>
      <form action={formAction} className="space-y-4">
        {debt && <input type="hidden" name="id" value={debt.id} />}

        <div className="space-y-1">
          <Label htmlFor="debt-name">Debt name</Label>
          <Input
            id="debt-name"
            name="name"
            required
            defaultValue={debt?.name ?? ''}
            placeholder="e.g. Credit Card, Car Loan"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="debt-balance">Balance (£)</Label>
            <Input
              id="debt-balance"
              name="balancePounds"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={debt ? (debt.balancePence / 100).toFixed(2) : ''}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="debt-rate">Interest rate (%)</Label>
            <Input
              id="debt-rate"
              name="interestRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              required
              defaultValue={debt ? (debt.interestRate / 100).toFixed(2) : ''}
              placeholder="e.g. 19.99"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="debt-min-payment">Minimum monthly payment (£)</Label>
          <Input
            id="debt-min-payment"
            name="minimumPaymentPounds"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={debt ? (debt.minimumPaymentPence / 100).toFixed(2) : ''}
            placeholder="0.00"
          />
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : debt ? 'Save changes' : 'Add debt'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
