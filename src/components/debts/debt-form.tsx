'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createDebtAction, updateDebtAction, type DebtActionState } from '@/app/actions/debts'

interface Account { id: number; name: string }
interface Pot { id: number; name: string; accountId: number | null }
interface Member { id: number; name: string }

interface DebtFormProps {
  debt?: {
    id: number
    name: string
    balancePence: number
    interestRate: number
    minimumPaymentPence: number
    paymentDueDate: Date | null
    accountId: number | null
    potId: number | null
    memberId: number | null
  } | null
  accounts: Account[]
  pots: Pot[]
  members: Member[]
  onClose: () => void
}

export function DebtForm({ debt, accounts, pots, members, onClose }: DebtFormProps) {
  const action = debt ? updateDebtAction : createDebtAction
  const [state, formAction, pending] = useActionState<DebtActionState, FormData>(
    action,
    {} as DebtActionState
  )
  const actedState = useRef<typeof state | null>(null)

  const initialAccountId = debt?.accountId?.toString() ?? (debt?.potId
    ? (pots.find((p) => p.id === debt.potId)?.accountId?.toString() ?? 'none')
    : 'none')
  const initialPotId = debt?.potId?.toString() ?? 'none'

  const [selectedAccountId, setSelectedAccountId] = useState(initialAccountId)
  const [selectedPotId, setSelectedPotId] = useState(initialPotId)
  const [selectedMemberId, setSelectedMemberId] = useState(debt?.memberId?.toString() ?? 'none')

  const potsForAccount = pots.filter(
    (p) => selectedAccountId !== 'none' && p.accountId === parseInt(selectedAccountId)
  )

  useEffect(() => {
    if (state.success && state !== actedState.current) {
      actedState.current = state
      onClose()
    }
  }, [state, onClose])

  function handleAccountChange(value: string) {
    setSelectedAccountId(value)
    setSelectedPotId('none')
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{debt ? 'Edit debt' : 'Add debt'}</DialogTitle>
      </DialogHeader>
      <form action={formAction} autoComplete="off" className="space-y-4">
        {debt && <input type="hidden" name="id" value={debt.id} />}
        <input type="hidden" name="accountId" value={selectedPotId !== 'none' ? 'none' : selectedAccountId} />
        <input type="hidden" name="potId" value={selectedPotId} />
        <input type="hidden" name="memberId" value={selectedMemberId} />

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

        <div className="space-y-1">
          <Label htmlFor="debt-member">Responsible member</Label>
          <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
            <SelectTrigger id="debt-member">
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select member…</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="debt-due-date">Next payment due date (optional)</Label>
          <Input
            id="debt-due-date"
            name="paymentDueDate"
            type="date"
            defaultValue={
              debt?.paymentDueDate
                ? new Date(debt.paymentDueDate).toISOString().split('T')[0]
                : ''
            }
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="debt-account">Payment account (optional)</Label>
          <Select value={selectedAccountId} onValueChange={handleAccountChange}>
            <SelectTrigger id="debt-account">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No account</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="debt-pot">Payment pot (optional)</Label>
          <Select
            value={selectedPotId}
            onValueChange={setSelectedPotId}
            disabled={selectedAccountId === 'none'}
          >
            <SelectTrigger id="debt-pot">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No pot (direct from account)</SelectItem>
              {potsForAccount.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
