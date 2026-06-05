'use client'

import { useActionState, useEffect, useState } from 'react'
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2 } from 'lucide-react'
import { createBillAction, updateBillAction, type BillActionState } from '@/app/actions/bills'

interface Pot {
  id: number
  name: string
}

interface BillSplit {
  memberName: string
  percentage: number
}

interface BillFormProps {
  bill?: {
    id: number
    name: string
    amountPence: number
    frequency: string
    potId: number | null
    nextDueDate: Date
    splits?: BillSplit[]
  } | null
  pots: Pot[]
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

export function BillForm({ bill, pots, onClose }: BillFormProps) {
  const action = bill ? updateBillAction : createBillAction
  const [state, formAction, pending] = useActionState<BillActionState, FormData>(
    action,
    {} as BillActionState
  )
  const [splits, setSplits] = useState<BillSplit[]>(bill?.splits ?? [])

  useEffect(() => {
    if (state.success) onClose()
  }, [state.success, onClose])

  function addSplit() {
    setSplits((prev) => [...prev, { memberName: '', percentage: 0 }])
  }

  function removeSplit(index: number) {
    setSplits((prev) => prev.filter((_, i) => i !== index))
  }

  function updateSplit(index: number, field: keyof BillSplit, value: string | number) {
    setSplits((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    )
  }

  const today = toDateInputValue(bill?.nextDueDate ?? new Date())

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{bill ? 'Edit bill' : 'Add bill'}</DialogTitle>
      </DialogHeader>
      <form action={formAction} className="space-y-4">
        {bill && <input type="hidden" name="id" value={bill.id} />}
        <input type="hidden" name="splits" value={JSON.stringify(splits)} />

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
          <Select name="frequency" defaultValue={bill?.frequency ?? 'monthly'}>
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
          <Label htmlFor="bill-pot">Assign to pot</Label>
          <Select name="potId" defaultValue={bill?.potId?.toString() ?? 'none'}>
            <SelectTrigger id="bill-pot">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (potless)</SelectItem>
              {pots.map((pot) => (
                <SelectItem key={pot.id} value={pot.id.toString()}>{pot.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Joint splits (optional)</Label>
            <Button type="button" variant="ghost" size="sm" onClick={addSplit}>
              <Plus className="size-3.5" />
              Add member
            </Button>
          </div>
          {splits.length > 0 && (
            <div className="space-y-2">
              {splits.map((split, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Name"
                    value={split.memberName}
                    onChange={(e) => updateSplit(i, 'memberName', e.target.value)}
                    className="flex-1"
                  />
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
              <p className="text-xs text-muted-foreground">
                Total: {splits.reduce((sum, s) => sum + s.percentage, 0)}%
              </p>
            </div>
          )}
        </div>

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
