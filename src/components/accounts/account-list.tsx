'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Dialog } from '@/components/ui/dialog'
import { deleteAccountAction } from '@/app/actions/accounts'
import { AccountForm } from '@/components/accounts/account-form'
import type { CSSProperties } from 'react'

interface Account {
  id: number
  name: string
  initialBalancePence: number
  createdAt: Date
}

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #FF5555 0%, #E83030 65%, #D42020 100%)',
  'linear-gradient(135deg, #1E3A8A 0%, #2563EB 65%, #3B82F6 100%)',
  'linear-gradient(135deg, #065F46 0%, #059669 65%, #10B981 100%)',
  'linear-gradient(135deg, #3730A3 0%, #4F46E5 65%, #6366F1 100%)',
  'linear-gradient(135deg, #92400E 0%, #D97706 65%, #F59E0B 100%)',
  'linear-gradient(135deg, #1E1B4B 0%, #4338CA 65%, #6366F1 100%)',
]
const CARD_SHADOWS = [
  '0 8px 28px rgba(255,85,85,0.28)',
  '0 8px 28px rgba(37,99,235,0.28)',
  '0 8px 28px rgba(5,150,105,0.28)',
  '0 8px 28px rgba(79,70,229,0.28)',
  '0 8px 28px rgba(217,119,6,0.28)',
  '0 8px 28px rgba(67,56,202,0.28)',
]

interface AccountListProps {
  accounts: Account[]
}

export function AccountList({ accounts }: AccountListProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<{
    id: number; name: string; initialBalancePence: number
  } | null>(null)

  const totalPence = accounts.reduce((sum, a) => sum + a.initialBalancePence, 0)

  const header = (
    <div className="flex items-start justify-between mb-8">
      <div className="animate-reveal-up" style={{ '--delay': '0ms' } as CSSProperties}>
        <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
        {accounts.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Total:{' '}
            <span className="font-bold tabular-nums text-foreground">
              £{(totalPence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </span>
          </p>
        )}
      </div>
      <div className="animate-reveal-up" style={{ '--delay': '60ms' } as CSSProperties}>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add account
        </Button>
      </div>
    </div>
  )

  if (accounts.length === 0) {
    return (
      <div>
        {header}
        <div
          className="animate-reveal-up flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border py-20 text-center"
          style={{ '--delay': '120ms' } as CSSProperties}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold mb-1">No accounts yet</h2>
          <p className="text-xs text-muted-foreground mb-5 max-w-xs">
            Add your first bank account to start tracking your balances.
          </p>
          <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
            Add account
          </Button>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <AccountForm members={[]} onClose={() => setCreateDialogOpen(false)} />
        </Dialog>
      </div>
    )
  }

  return (
    <div>
      {header}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account, i) => (
          <AccountCard
            key={account.id}
            account={account}
            index={i}
            gradient={CARD_GRADIENTS[i % CARD_GRADIENTS.length]}
            cardShadow={CARD_SHADOWS[i % CARD_SHADOWS.length]}
            onEdit={() => setEditingAccount(account)}
          />
        ))}
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="animate-reveal-up flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/70 py-12 text-muted-foreground transition-all hover:border-primary/40 hover:text-primary hover:bg-primary/5"
          style={{ '--delay': `${80 + accounts.length * 50}ms` } as CSSProperties}
        >
          <Plus className="h-5 w-5 mb-1.5" />
          <span className="text-xs font-semibold">Add account</span>
        </button>
      </div>
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <AccountForm members={[]} onClose={() => setCreateDialogOpen(false)} />
      </Dialog>
      <Dialog open={editingAccount !== null} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <AccountForm key={editingAccount?.id ?? 'new'} account={{ ...(editingAccount!), ownerId: null, shares: [] }} members={[]} onClose={() => setEditingAccount(null)} />
      </Dialog>
    </div>
  )
}

interface AccountCardProps {
  account: Account
  index: number
  gradient: string
  cardShadow: string
  onEdit: () => void
}

function AccountCard({ account, index, gradient, cardShadow, onEdit }: AccountCardProps) {
  const [deletePending, setDeletePending] = useState(false)

  async function handleDelete() {
    setDeletePending(true)
    await deleteAccountAction(account.id)
    setDeletePending(false)
  }

  return (
    <div
      className="animate-reveal-up group relative overflow-hidden rounded-3xl px-6 pt-5 pb-6 text-white min-h-[160px] flex flex-col justify-between"
      style={{ '--delay': `${80 + index * 50}ms`, background: gradient, boxShadow: cardShadow } as CSSProperties}
    >
      {/* Card decorations */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute bottom-0 right-8 h-24 w-24 rounded-full bg-white/6" />

      {/* Actions */}
      <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          aria-label={`Edit ${account.name}`}
          className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/25 hover:bg-white/35 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              aria-label={`Delete ${account.name}`}
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/25 hover:bg-red-500/60 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &ldquo;{account.name}&rdquo;. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep account</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deletePending}>
                {deletePending ? 'Deleting…' : 'Delete account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <p className="relative text-[12px] font-semibold text-white/65">{account.name}</p>
      <div className="relative">
        <p className="text-[32px] font-bold tabular-nums leading-none tracking-tight">
          £{(account.initialBalancePence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-[11px] text-white/50 mt-1.5">
          Added {new Date(account.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
    </div>
  )
}
