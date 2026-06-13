'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

interface Member {
  id: number
  name: string
}

interface AccountFormProps {
  account?: {
    id: number
    name: string
    ownerId: number | null
    shares: Array<{ memberId: number; memberName: string; defaultPercentage: number }>
  } | null
  members: Member[]
  onClose: () => void
}

interface ShareRow {
  memberId: number
  defaultPercentage: number
}

export function AccountForm({ account, members, onClose }: AccountFormProps) {
  const action = account ? updateAccountAction : createAccountAction
  const [state, formAction, pending] = useActionState<AccountActionState, FormData>(
    action,
    {} as AccountActionState
  )
  const actedState = useRef<typeof state | null>(null)

  const [ownerId, setOwnerId] = useState<string>(account?.ownerId?.toString() ?? 'none')
  const [shared, setShared] = useState(account ? account.shares.length > 0 : false)
  const [shares, setShares] = useState<ShareRow[]>(
    account?.shares.map((s) => ({ memberId: s.memberId, defaultPercentage: s.defaultPercentage })) ?? []
  )

  useEffect(() => {
    if (state.success && state !== actedState.current) {
      actedState.current = state
      onClose()
    }
  }, [state, onClose])

  function handleOwnerChange(value: string) {
    setOwnerId(value)
    if (shared && value !== 'none') {
      // Re-seed shares with owner at 100%
      setShares([{ memberId: Number(value), defaultPercentage: 100 }])
    }
  }

  function handleSharedToggle(checked: boolean) {
    setShared(checked)
    if (checked && ownerId !== 'none') {
      setShares([{ memberId: Number(ownerId), defaultPercentage: 100 }])
    } else {
      setShares([])
    }
  }

  function addShare() {
    setShares((prev) => [...prev, { memberId: 0, defaultPercentage: 0 }])
  }

  function removeShare(index: number) {
    setShares((prev) => prev.filter((_, i) => i !== index))
  }

  function updateShare(index: number, field: keyof ShareRow, value: number) {
    setShares((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const shareTotal = shares.reduce((s, r) => s + r.defaultPercentage, 0)
  const usedMemberIds = shares.map((s) => s.memberId)

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{account ? 'Edit account' : 'Add account'}</DialogTitle>
      </DialogHeader>
      <form action={formAction} autoComplete="off" className="flex flex-col gap-4">
        {account && <input type="hidden" name="id" value={account.id} />}
        <input type="hidden" name="ownerId" value={ownerId} />
        <input type="hidden" name="shares" value={shared ? JSON.stringify(shares) : '[]'} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="account-name">Account name</Label>
          <Input
            id="account-name"
            name="name"
            required
            defaultValue={account?.name ?? ''}
            placeholder="e.g. Lloyds Current Account"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="account-owner">Owner</Label>
          <Select value={ownerId} onValueChange={handleOwnerChange}>
            <SelectTrigger id="account-owner">
              <SelectValue placeholder="Select owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select owner…</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Shared account</p>
            <p className="text-xs text-muted-foreground">Split bills between household members</p>
          </div>
          <Switch
            checked={shared}
            onCheckedChange={handleSharedToggle}
            disabled={ownerId === 'none'}
          />
        </div>

        {shared && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Default split</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addShare}>
                <Plus className="size-3.5" />
                Add member
              </Button>
            </div>
            {shares.map((share, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={share.memberId ? share.memberId.toString() : ''}
                  onValueChange={(v) => updateShare(i, 'memberId', Number(v))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members
                      .filter((m) => m.id === share.memberId || !usedMemberIds.includes(m.id))
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="%"
                  value={share.defaultPercentage || ''}
                  onChange={(e) => updateShare(i, 'defaultPercentage', parseInt(e.target.value) || 0)}
                  className="w-20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeShare(i)}
                  className="text-destructive shrink-0"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <p className={`text-xs ${shareTotal === 100 ? 'text-muted-foreground' : 'text-destructive'}`}>
              Total: {shareTotal}% {shareTotal !== 100 && '(must equal 100%)'}
            </p>
          </div>
        )}

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : account ? 'Save changes' : 'Add account'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
