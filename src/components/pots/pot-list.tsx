'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deletePotAction, resetPotAllocationsAction } from '@/app/actions/pots'
import { PotForm } from '@/components/pots/pot-form'
import { sumPotAllocations, validatePotAllocations, getPotBalance } from '@/lib/engine/pots'
import type { Pot as EnginePot } from '@/lib/engine/types'

interface Pot {
  id: number
  name: string
  allocatedPence: number
  rollover: boolean
  createdAt: Date
}

interface PotListProps {
  pots: Pot[]
}

export function PotList({ pots }: PotListProps) {
  const [incomePence, setIncomePence] = useState<number>(0)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingPot, setEditingPot] = useState<{
    id: number
    name: string
    allocatedPence: number
    rollover: boolean
  } | null>(null)
  const [resetPending, setResetPending] = useState(false)

  const enginePots: EnginePot[] = pots.map((p) => ({
    id: p.id,
    name: p.name,
    allocatedPence: p.allocatedPence,
    rollover: p.rollover,
  }))
  const totalAllocatedPence = sumPotAllocations(enginePots)
  const validation = validatePotAllocations(incomePence, enginePots)

  async function handleReset() {
    setResetPending(true)
    await resetPotAllocationsAction()
    setResetPending(false)
  }

  const header = (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold">Pots</h1>
      <div className="flex items-center gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Reset month</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all pot allocations?</AlertDialogTitle>
              <AlertDialogDescription>
                This will set all pot allocations to £0.00. Your pot names and settings will be kept.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep allocations</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleReset}
                disabled={resetPending}
              >
                {resetPending ? 'Resetting...' : 'Reset allocations'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add pot
        </Button>
      </div>
    </div>
  )

  const incomeSection = (
    <div className="mb-4">
      <Label htmlFor="income-input" className="text-sm text-muted-foreground">
        Monthly income (£)
      </Label>
      <Input
        id="income-input"
        type="number"
        step="0.01"
        min="0"
        defaultValue="0.00"
        className="mt-1 w-48"
        onChange={(e) =>
          setIncomePence(Math.round(parseFloat(e.target.value || '0') * 100))
        }
      />
      <p className="text-xs text-muted-foreground mt-1">
        Income resets when you reload the page. Persistent income settings arrive in a future update.
      </p>
    </div>
  )

  const allocationSummary = (
    <div className="mb-4">
      <p
        className={`text-xl font-semibold ${validation.valid ? '' : 'text-yellow-700'}`}
      >
        Allocated: £{(totalAllocatedPence / 100).toFixed(2)} / Income: £
        {(incomePence / 100).toFixed(2)}
      </p>
    </div>
  )

  const overAllocationWarning = !validation.valid && (
    <Alert className="border-yellow-400 bg-yellow-50 text-yellow-900 mb-4">
      <AlertTitle>Over-allocated</AlertTitle>
      <AlertDescription>
        Total allocation (£{(totalAllocatedPence / 100).toFixed(2)}) exceeds monthly income (£
        {(incomePence / 100).toFixed(2)}). You can still save, but review your pots.
      </AlertDescription>
    </Alert>
  )

  const dialogs = (
    <>
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <PotForm onClose={() => setCreateDialogOpen(false)} />
      </Dialog>
      <Dialog
        open={editingPot !== null}
        onOpenChange={(open) => !open && setEditingPot(null)}
      >
        <PotForm pot={editingPot} onClose={() => setEditingPot(null)} />
      </Dialog>
    </>
  )

  if (pots.length === 0) {
    return (
      <div>
        {header}
        {incomeSection}
        {allocationSummary}
        {overAllocationWarning}

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-lg font-semibold mb-2">No pots yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your first budget pot to start allocating your income.
          </p>
          <Button variant="ghost" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add pot
          </Button>
        </div>

        {dialogs}
      </div>
    )
  }

  return (
    <div>
      {header}
      {incomeSection}
      {allocationSummary}
      {overAllocationWarning}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Allocation (£)</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pots.map((pot) => (
            <PotRow
              key={pot.id}
              pot={pot}
              onEdit={() => setEditingPot(pot)}
            />
          ))}
        </TableBody>
      </Table>

      {dialogs}
    </div>
  )
}

interface PotRowProps {
  pot: Pot
  onEdit: () => void
}

function PotRow({ pot, onEdit }: PotRowProps) {
  const [deletePending, setDeletePending] = useState(false)

  async function handleDelete() {
    setDeletePending(true)
    await deletePotAction(pot.id)
    setDeletePending(false)
  }

  const balance = getPotBalance(pot.allocatedPence, 0)

  return (
    <TableRow>
      <TableCell>{pot.name}</TableCell>
      <TableCell>£{(pot.allocatedPence / 100).toFixed(2)}</TableCell>
      <TableCell>Balance: £{(balance / 100).toFixed(2)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${pot.name}`}
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                aria-label={`Delete ${pot.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete pot?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &ldquo;{pot.name}&rdquo;. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep pot</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deletePending}
                >
                  {deletePending ? 'Deleting...' : 'Delete pot'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  )
}
