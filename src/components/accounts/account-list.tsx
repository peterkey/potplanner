'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
import { Dialog } from '@/components/ui/dialog'
import { deleteAccountAction } from '@/app/actions/accounts'
import { AccountForm } from '@/components/accounts/account-form'

interface Account {
  id: number
  name: string
  initialBalancePence: number
  createdAt: Date
}

interface AccountListProps {
  accounts: Account[]
}

export function AccountList({ accounts }: AccountListProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<{
    id: number
    name: string
    initialBalancePence: number
  } | null>(null)

  const totalPence = accounts.reduce((sum, a) => sum + a.initialBalancePence, 0)

  if (accounts.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Accounts</h1>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add account
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-lg font-semibold mb-2">No accounts yet</h2>
          <p className="text-muted-foreground mb-6">
            Add your first bank account to start tracking your balances.
          </p>
          <Button variant="ghost" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add account
          </Button>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <AccountForm onClose={() => setCreateDialogOpen(false)} />
        </Dialog>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add account
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              onEdit={() => setEditingAccount(account)}
            />
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="text-muted-foreground">Total</TableCell>
            <TableCell className="text-xl font-semibold">
              £{(totalPence / 100).toFixed(2)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <AccountForm onClose={() => setCreateDialogOpen(false)} />
      </Dialog>

      <Dialog
        open={editingAccount !== null}
        onOpenChange={(open) => !open && setEditingAccount(null)}
      >
        <AccountForm
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
        />
      </Dialog>
    </div>
  )
}

interface AccountRowProps {
  account: Account
  onEdit: () => void
}

function AccountRow({ account, onEdit }: AccountRowProps) {
  const [deletePending, setDeletePending] = useState(false)

  async function handleDelete() {
    setDeletePending(true)
    await deleteAccountAction(account.id)
    setDeletePending(false)
  }

  return (
    <TableRow>
      <TableCell>{account.name}</TableCell>
      <TableCell>£{(account.initialBalancePence / 100).toFixed(2)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${account.name}`}
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
                aria-label={`Delete ${account.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deletePending}
                >
                  {deletePending ? 'Deleting...' : 'Delete account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  )
}
