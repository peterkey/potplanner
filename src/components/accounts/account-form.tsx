'use client'

import { useActionState, useEffect } from 'react'
import {
  createAccountAction,
  updateAccountAction,
  type AccountActionState,
} from '@/app/actions/accounts'
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface AccountFormProps {
  account?: { id: number; name: string; initialBalancePence: number } | null
  onClose: () => void
}

export function AccountForm({ account, onClose }: AccountFormProps) {
  const action = account ? updateAccountAction : createAccountAction
  const [state, formAction, pending] = useActionState<AccountActionState, FormData>(
    action,
    {} as AccountActionState
  )

  useEffect(() => {
    if (state.success) {
      onClose()
    }
  }, [state.success, onClose])

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{account ? 'Edit account' : 'Add account'}</DialogTitle>
      </DialogHeader>
      <form action={formAction} className="flex flex-col gap-4">
        {account && (
          <input type="hidden" name="id" value={account.id} />
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="account-name">Account name</Label>
          <Input
            id="account-name"
            name="name"
            required
            defaultValue={account?.name ?? ''}
            placeholder="e.g. Current Account"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="account-balance">Balance (£)</Label>
          <Input
            id="account-balance"
            name="balancePounds"
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              account ? (account.initialBalancePence / 100).toFixed(2) : '0.00'
            }
          />
        </div>
        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <DialogFooter>
          <Button type="submit" variant="default" disabled={pending}>
            {pending
              ? 'Saving...'
              : account
                ? 'Save changes'
                : 'Add account'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
