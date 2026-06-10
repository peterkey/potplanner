'use client'

import { useActionState, useEffect, useState } from 'react'
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createPotAction, updatePotAction, type PotActionState } from '@/app/actions/pots'

interface Account {
  id: number
  name: string
}

interface PotFormProps {
  pot?: { id: number; name: string; allocatedPence: number; rollover: boolean; accountId: number | null } | null
  accounts: Account[]
  defaultAccountId?: number | null
  onClose: () => void
}

export function PotForm({ pot, accounts, defaultAccountId, onClose }: PotFormProps) {
  const action = pot ? updatePotAction : createPotAction
  const [state, formAction, pending] = useActionState(action, {} as PotActionState)

  const [selectedAccountId, setSelectedAccountId] = useState(
    pot?.accountId?.toString() ?? defaultAccountId?.toString() ?? 'none'
  )

  useEffect(() => {
    if (state.success) {
      onClose()
    }
  }, [state.success, onClose])

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{pot ? 'Edit pot' : 'Add pot'}</DialogTitle>
      </DialogHeader>
      <form action={formAction} className="space-y-4">
        {pot && <input type="hidden" name="id" value={pot.id} />}

        <div className="space-y-1">
          <Label htmlFor="pot-name">Pot name</Label>
          <Input
            id="pot-name"
            name="name"
            required
            defaultValue={pot?.name ?? ''}
            placeholder="e.g. Groceries"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="pot-account">Account</Label>
          <Select name="accountId" value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger id="pot-account">
              <SelectValue placeholder="No account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No account</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id.toString()}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="pot-allocation">Monthly allocation (£)</Label>
          <Input
            id="pot-allocation"
            name="allocationPounds"
            type="number"
            step="0.01"
            min="0"
            defaultValue={pot ? (pot.allocatedPence / 100).toFixed(2) : '0.00'}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="pot-rollover">Roll over unspent amount</Label>
            <Switch
              id="pot-rollover"
              name="rollover"
              defaultChecked={pot?.rollover ?? false}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            When enabled, unspent balance carries forward each month (v2 feature — saved but inactive)
          </p>
        </div>

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : pot ? 'Save changes' : 'Add pot'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
