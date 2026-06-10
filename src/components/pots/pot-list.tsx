'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog } from '@/components/ui/dialog'
import { useMember } from '@/lib/context/member-context'
import { deletePotAction, resetPotAllocationsAction } from '@/app/actions/pots'
import { PotForm } from '@/components/pots/pot-form'
import { PotDonut } from '@/components/pots/pot-donut'
import { sumPotAllocations, validatePotAllocations, getPotBalance } from '@/lib/engine/pots'
import { staggerContainer, staggerItem } from '@/components/motion'
import type { Pot as EnginePot } from '@/lib/engine/types'

interface Pot {
  id: number
  name: string
  allocatedPence: number
  rollover: boolean
  accountId: number | null
  createdAt: Date
}

interface Account {
  id: number
  name: string
  ownerId: number | null
  shares: Array<{ memberId: number }>
}

const POT_ACCENTS: Array<{ bar: string; text: string }> = [
  { bar: '#FF3B30', text: '#B80A00' },
  { bar: '#00B9A9', text: '#007870' },
  { bar: '#FFC800', text: '#8A6B00' },
  { bar: '#14233C', text: '#14233C' },
  { bar: '#E8634A', text: '#B84225' },
  { bar: '#3EC9BA', text: '#1A8075' },
  { bar: '#FFD340', text: '#8A7000' },
  { bar: '#5B8AC5', text: '#2D5F94' },
]

interface PotListProps {
  pots: Pot[]
  accounts: Account[]
}

export function PotList({ pots, accounts }: PotListProps) {
  const [incomePence, setIncomePence] = useState<number>(0)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingPot, setEditingPot] = useState<{
    id: number; name: string; allocatedPence: number; rollover: boolean; accountId: number | null
  } | null>(null)
  const [resetPending, setResetPending] = useState(false)

  const { activeMemberId } = useMember()

  const memberAccountIds = useMemo(() => {
    if (!activeMemberId) return null
    return new Set(
      accounts
        .filter((a) => a.ownerId === activeMemberId || a.shares.some((s) => s.memberId === activeMemberId))
        .map((a) => a.id)
    )
  }, [accounts, activeMemberId])

  const visiblePots = useMemo(() => {
    if (!memberAccountIds) return pots
    return pots.filter((p) => p.accountId === null || memberAccountIds.has(p.accountId))
  }, [pots, memberAccountIds])

  const enginePots: EnginePot[] = visiblePots.map((p) => ({
    id: p.id, name: p.name, allocatedPence: p.allocatedPence, rollover: p.rollover,
  }))
  const totalAllocatedPence = sumPotAllocations(enginePots)
  const validation = validatePotAllocations(incomePence, enginePots)

  async function handleReset() {
    setResetPending(true)
    await resetPotAllocationsAction()
    setResetPending(false)
  }

  const dialogs = (
    <>
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <PotForm accounts={accounts} onClose={() => setCreateDialogOpen(false)} />
      </Dialog>
      <Dialog open={editingPot !== null} onOpenChange={(open) => !open && setEditingPot(null)}>
        <PotForm key={editingPot?.id ?? 'new'} pot={editingPot} accounts={accounts} onClose={() => setEditingPot(null)} />
      </Dialog>
    </>
  )

  const header = (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="t-h1">Pots</h1>
        <p className="t-body text-muted-foreground mt-1">
          Allocated:{' '}
          <span className={`font-bold font-money ${!validation.valid && incomePence > 0 ? 'text-amber-600' : 'text-foreground'}`}>
            £{(totalAllocatedPence / 100).toFixed(2)}
          </span>
          {incomePence > 0 && (
            <span className="text-muted-foreground"> of £{(incomePence / 100).toFixed(2)}</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset month
            </Button>
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
              <AlertDialogAction variant="destructive" onClick={handleReset} disabled={resetPending}>
                {resetPending ? 'Resetting…' : 'Reset allocations'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add pot
        </Button>
      </div>
    </div>
  )

  const incomeRow = (
    <div className="mb-6 flex items-center gap-3 flex-wrap">
      <label htmlFor="income-input" className="t-label text-muted-foreground whitespace-nowrap">
        Monthly income
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-3 t-body text-muted-foreground font-medium">£</span>
        <input
          id="income-input"
          type="number"
          step="0.01"
          min="0"
          defaultValue="0.00"
          className="h-9 w-36 rounded-xl border border-border bg-background pl-7 pr-3 text-sm font-money text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          onChange={(e) => setIncomePence(Math.round(parseFloat(e.target.value || '0') * 100))}
        />
      </div>
      {incomePence > 0 && visiblePots.length > 0 && (
        <div className="ml-auto hidden sm:block">
          <PotDonut
            pots={visiblePots.map((p, i) => ({
              name: p.name,
              allocatedPence: p.allocatedPence,
              color: POT_ACCENTS[i % POT_ACCENTS.length].bar,
            }))}
            totalPence={incomePence}
          />
        </div>
      )}
    </div>
  )

  const overWarning = !validation.valid && incomePence > 0 && (
    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
      <Alert className="border-0 bg-transparent p-0">
        <AlertTitle className="text-[13px] font-semibold text-amber-700">Over-allocated</AlertTitle>
        <AlertDescription className="text-[12px] text-amber-600/80 mt-0.5">
          Total allocation (£{(totalAllocatedPence / 100).toFixed(2)}) exceeds monthly income (£{(incomePence / 100).toFixed(2)}).
        </AlertDescription>
      </Alert>
    </div>
  )

  if (visiblePots.length === 0) {
    return (
      <div>
        {header}
        {incomeRow}
        {overWarning}
        <div className="elevation-1 flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <p className="t-h2 mb-1">No pots yet</p>
          <p className="t-label text-muted-foreground mb-5 max-w-xs">
            Create your first budget pot to start allocating your income.
          </p>
          <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
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
      {incomeRow}
      {overWarning}
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {visiblePots.map((pot, i) => (
          <motion.div key={pot.id} variants={staggerItem}>
            <PotCard
              pot={pot}
              incomePence={incomePence}
              accent={POT_ACCENTS[i % POT_ACCENTS.length]}
              onEdit={() => setEditingPot({ id: pot.id, name: pot.name, allocatedPence: pot.allocatedPence, rollover: pot.rollover, accountId: pot.accountId })}
            />
          </motion.div>
        ))}
        <motion.div variants={staggerItem}>
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full min-h-[140px] rounded-3xl border-2 border-dashed border-primary/20 text-muted-foreground transition-all hover:border-primary/45 hover:text-primary hover:bg-accent"
          >
            <Plus className="h-5 w-5 mb-1.5" />
            <span className="t-label font-semibold">Add pot</span>
          </button>
        </motion.div>
      </motion.div>
      {dialogs}
    </div>
  )
}

interface PotCardProps {
  pot: Pot
  incomePence: number
  accent: { bar: string; text: string }
  onEdit: () => void
}

function PotCard({ pot, incomePence, accent, onEdit }: PotCardProps) {
  const [deletePending, setDeletePending] = useState(false)

  async function handleDelete() {
    setDeletePending(true)
    await deletePotAction(pot.id)
    setDeletePending(false)
  }

  const balance = getPotBalance(pot.allocatedPence, 0)
  const fillPct = incomePence > 0 ? Math.min(100, (pot.allocatedPence / incomePence) * 100) : 0
  const isOver = balance < 0

  return (
    <div
      className="elevation-1 group relative overflow-hidden border-l-4 px-5 py-5"
      style={{ borderLeftColor: accent.bar }}
    >
      {/* Actions */}
      <div className="absolute right-4 top-4 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          aria-label={`Edit ${pot.name}`}
          className="flex h-7 w-7 items-center justify-center rounded-xl bg-background/80 text-foreground/60 hover:text-foreground hover:bg-background transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              aria-label={`Delete ${pot.name}`}
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-background/80 text-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
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
              <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deletePending}>
                {deletePending ? 'Deleting…' : 'Delete pot'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Pot name + rollover */}
      <div className="flex items-center gap-2 mb-3 pr-14">
        <p className="t-h2" style={{ color: accent.text }}>
          {pot.name}
        </p>
        {pot.rollover && (
          <span
            className="t-caption font-bold rounded-full px-2 py-0.5"
            style={{ backgroundColor: `${accent.bar}22`, color: accent.text }}
          >
            Rollover
          </span>
        )}
      </div>

      <p className={`t-display font-money leading-none mb-0.5 ${isOver ? 'text-destructive' : 'text-foreground'}`}>
        £{(pot.allocatedPence / 100).toFixed(2)}
      </p>
      <p className="t-caption text-muted-foreground mb-4">allocated this month</p>

      <div
        className="h-2.5 rounded-full overflow-hidden"
        style={{ backgroundColor: `${accent.bar}28` }}
      >
        <div
          className="h-full rounded-full animate-progress"
          style={{ width: `${fillPct}%`, backgroundColor: isOver ? '#EF4444' : accent.bar }}
        />
      </div>
      {incomePence > 0 && (
        <p className="t-caption text-muted-foreground/60 mt-1.5 font-money">
          {fillPct.toFixed(0)}% of income
        </p>
      )}
    </div>
  )
}
