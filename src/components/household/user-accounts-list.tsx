'use client'

import { useState } from 'react'
import { Trash2, ShieldCheck, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'

interface UserAccount {
  id: number
  email: string
  isAdmin: boolean
  createdAt: Date
}

interface UserAccountsListProps {
  users: UserAccount[]
  currentUserId: number
}

export function UserAccountsList({ users, currentUserId }: UserAccountsListProps) {
  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-4">
        <KeyRound className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold">User accounts</h2>
        <span className="ml-auto text-xs text-muted-foreground">{users.length} account{users.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
        {users.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            isSelf={user.id === currentUserId}
          />
        ))}
      </div>
    </div>
  )
}

function UserRow({ user, isSelf }: { user: UserAccount; isSelf: boolean }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const canDelete = !isSelf && !user.isAdmin

  async function handleDelete() {
    setPending(true)
    await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    setPending(false)
    router.refresh()
  }

  return (
    <div className="flex items-center justify-between px-5 py-3.5 bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm select-none">
          {user.email[0].toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{user.email}</span>
            {isSelf && (
              <span className="text-xs text-muted-foreground">(you)</span>
            )}
          </div>
          {user.isAdmin && (
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className="h-3 w-3 text-primary" />
              <span className="text-xs text-primary">Admin</span>
            </div>
          )}
        </div>
      </div>

      {canDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive" aria-label={`Delete ${user.email}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove <strong>{user.email}</strong> and they will no longer be able to sign in.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={pending}>
                {pending ? 'Deleting...' : 'Delete account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
