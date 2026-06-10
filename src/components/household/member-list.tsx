'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Dialog } from '@/components/ui/dialog'
import { MemberForm } from '@/components/household/member-form'
import { deleteMemberAction } from '@/app/actions/household-members'

interface Member {
  id: number
  name: string
  createdAt: Date
}

interface MemberListProps {
  members: Member[]
}

export function MemberList({ members }: MemberListProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Household</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add member
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-card border border-border">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-sm font-semibold mb-1">No household members yet</h2>
          <p className="text-xs text-muted-foreground mb-5 max-w-xs">
            Add the people you share bills with. You can then assign them a share of each bill.
          </p>
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            Add first member
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              onEdit={() => setEditingMember(member)}
            />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <MemberForm onClose={() => setCreateOpen(false)} />
      </Dialog>

      <Dialog open={editingMember !== null} onOpenChange={(o) => !o && setEditingMember(null)}>
        <MemberForm member={editingMember} onClose={() => setEditingMember(null)} />
      </Dialog>
    </div>
  )
}

function MemberRow({ member, onEdit }: { member: Member; onEdit: () => void }) {
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    setPending(true)
    await deleteMemberAction(member.id)
    setPending(false)
  }

  return (
    <div className="flex items-center justify-between px-5 py-3.5 bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm select-none">
          {member.name[0].toUpperCase()}
        </div>
        <span className="text-sm font-medium">{member.name}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label={`Edit ${member.name}`} onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive" aria-label={`Delete ${member.name}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {member.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes them from your household. Existing bill splits that reference their name are not affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={pending}>
                {pending ? 'Removing...' : 'Remove'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
