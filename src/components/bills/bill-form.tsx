'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2 } from 'lucide-react'
import { createBillAction, updateBillAction, type BillActionState } from '@/app/actions/bills'

interface AccountShare {
  memberId: number
  memberName: string
  defaultPercentage: number
}

interface Account {
  id: number
  name: string
  ownerId: number | null
  shares: AccountShare[]
}

interface Pot {
  id: number
  name: string
  accountId: number | null
}

interface BillSplit {
  memberId: number
  percentage: number
}

interface Member {
  id: number
  name: string
}

interface BillFormProps {
  bill?: {
    id: number
    name: string
    amountPence: number
    frequency: string
    potId: number | null
    accountId: number | null
    nextDueDate: Date
    splits?: Array<{ memberId: number; memberName: string; percentage: number }>
  } | null
  pots: Pot[]
  accounts: Account[]
  members?: Member[]
  defaultPotId?: number | null
  defaultAccountId?: number | null
  onClose: () => void
}

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  four_weekly: 'Every 4 weeks',
  monthly: 'Monthly',
  annual: 'Annual',
}

function toDateInputValue(date: Date): string {
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function deriveInitialAccountId(
  bill: BillFormProps['bill'],
  pots: Pot[],
  defaultPotId?: number | null,
  defaultAccountId?: number | null
): string {
  if (bill?.accountId) return bill.accountId.toString()
  const potId = bill?.potId ?? defaultPotId
  if (potId) {
    const pot = pots.find((p) => p.id === potId)
    if (pot?.accountId) return pot.accountId.toString()
  }
  if (defaultAccountId) return defaultAccountId.toString()
  return 'none'
}

export function BillForm({ bill, pots, accounts, members = [], defaultPotId, defaultAccountId, onClose }: BillFormProps) {
  const action = bill ? updateBillAction : createBillAction
  const [state, formAction, pending] = useActionState<BillActionState, FormData>(
    action,
    {} as BillActionState
  )
  const actedState = useRef<typeof state | null>(null)

  const initialAccountId = deriveInitialAccountId(bill, pots, defaultPotId, defaultAccountId)
  const initialPotId = bill?.potId?.toString() ?? defaultPotId?.toString() ?? 'none'

  const [selectedFrequency, setSelectedFrequency] = useState(bill?.frequency ?? 'monthly')
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccountId)
  const [selectedPotId, setSelectedPotId] = useState(initialPotId)
  const [splits, setSplits] = useState<BillSplit[]>(
    bill?.splits?.map((s) => ({ memberId: s.memberId, percentage: s.percentage })) ?? []
  )

  useEffect(() => {
    if (state.success && state !== actedState.current) {
      actedState.current = state
      onClose()
    }
  }, [state, onClose])

  function getAccountShares(accountId: string): AccountShare[] {
    if (accountId === 'none') return []
    const account = accounts.find((a) => a.id === parseInt(accountId))
    return account?.shares ?? []
  }

  function handleAccountChange(value: string) {
    setSelectedAccountId(value)
    setSelectedPotId('none')
    // Pre-fill splits from account shares if account is shared
    const accountShares = getAccountShares(value)
    if (accountShares.length > 0) {
      setSplits(accountShares.map((s) => ({ memberId: s.memberId, percentage: s.defaultPercentage })))
    } else {
      setSplits([])
    }
  }

  const selectedAccount = accounts.find((a) => a.id === parseInt(selectedAccountId))
  const isSharedAccount = (selectedAccount?.shares.length ?? 0) > 0
  const potsForAccount = pots.filter(
    (p) => selectedAccountId !== 'none' && p.accountId === parseInt(selectedAccountId)
  )

  function addSplit() {
    setSplits((prev) => [...prev, { memberId: 0, percentage: 0 }])
  }

  function removeSplit(index: number) {
    setSplits((prev) => prev.filter((_, i) => i !== index))
  }

  function updateSplit(index: number, field: keyof BillSplit, value: number) {
    setSplits((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const splitTotal = splits.reduce((s, r) => s + r.percentage, 0)
  const usedMemberIds = splits.map((s) => s.memberId)
  const today = toDateInputValue(bill?.nextDueDate ?? new Date())

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{bill ? 'Edit bill' : 'Add bill'}</DialogTitle>
      </DialogHeader>
      <form action={formAction} autoComplete="off" className="space-y-4">
        {bill && <input type="hidden" name="id" value={bill.id} />}
        <input type="hidden" name="splits" value={JSON.stringify(splits.filter((s) => s.memberId > 0))} />
        <input type="hidden" name="accountId" value={selectedPotId !== 'none' ? 'none' : selectedAccountId} />
        <input type="hidden" name="potId" value={selectedPotId} />

        <div className="space-y-1">
          <Label htmlFor="bill-name">Bill name</Label>
          <Input
            id="bill-name"
            name="name"
            required
            defaultValue={bill?.name ?? ''}
            placeholder="e.g. Netflix, Electricity"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="bill-amount">Amount (£)</Label>
            <Input
              id="bill-amount"
              name="amountPounds"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={bill ? (bill.amountPence / 100).toFixed(2) : ''}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="bill-due-date">Next due date</Label>
            <Input
              id="bill-due-date"
              name="nextDueDate"
              type="date"
              required
              defaultValue={today}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="bill-frequency">Frequency</Label>
          <Select name="frequency" value={selectedFrequency} onValueChange={setSelectedFrequency}>
            <SelectTrigger id="bill-frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="bill-account">Account</Label>
          <Select value={selectedAccountId} onValueChange={handleAccountChange}>
            <SelectTrigger id="bill-account">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id.toString()}>{account.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="bill-pot">Pot (optional)</Label>
          <Select
            value={selectedPotId}
            onValueChange={setSelectedPotId}
            disabled={selectedAccountId === 'none'}
          >
            <SelectTrigger id="bill-pot">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No pot (direct from account)</SelectItem>
              {potsForAccount.map((pot) => (
                <SelectItem key={pot.id} value={pot.id.toString()}>{pot.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(isSharedAccount || splits.length > 0) && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Split between members</Label>
                  {isSharedAccount && (
                    <p className="text-xs text-muted-foreground">Pre-filled from account defaults</p>
                  )}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={addSplit}>
                  <Plus className="size-3.5" />
                  Add member
                </Button>
              </div>
              {splits.map((split, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select
                    value={split.memberId ? split.memberId.toString() : ''}
                    onValueChange={(v) => updateSplit(i, 'memberId', Number(v))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members
                        .filter((m) => m.id === split.memberId || !usedMemberIds.includes(m.id))
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
                    value={split.percentage || ''}
                    onChange={(e) => updateSplit(i, 'percentage', parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSplit(i)}
                    className="text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              {splits.length > 0 && (
                <p className={`text-xs ${splitTotal === 100 ? 'text-muted-foreground' : 'text-destructive'}`}>
                  Total: {splitTotal}% {splitTotal !== 100 && '(must equal 100%)'}
                </p>
              )}
            </div>
          </>
        )}

        {!isSharedAccount && splits.length === 0 && members.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Joint split (optional)</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addSplit}>
                  <Plus className="size-3.5" />
                  Add member
                </Button>
              </div>
            </div>
          </>
        )}

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : bill ? 'Save changes' : 'Add bill'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
