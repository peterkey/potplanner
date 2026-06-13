'use client'

import { useActionState, useEffect, useRef } from 'react'
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createMemberAction, updateMemberAction, type MemberActionState } from '@/app/actions/household-members'

interface MemberFormProps {
  member?: { id: number; name: string } | null
  onClose: () => void
}

export function MemberForm({ member, onClose }: MemberFormProps) {
  const action = member ? updateMemberAction : createMemberAction
  const [state, formAction, pending] = useActionState<MemberActionState, FormData>(
    action,
    {} as MemberActionState
  )
  const actedState = useRef<typeof state | null>(null)

  useEffect(() => {
    if (state.success && state !== actedState.current) {
      actedState.current = state
      onClose()
    }
  }, [state, onClose])

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{member ? 'Edit member' : 'Add household member'}</DialogTitle>
      </DialogHeader>
      <form action={formAction} autoComplete="off" className="space-y-4">
        {member && <input type="hidden" name="id" value={member.id} />}
        <div className="space-y-1">
          <Label htmlFor="member-name">Name</Label>
          <Input
            id="member-name"
            name="name"
            required
            defaultValue={member?.name ?? ''}
            placeholder="e.g. Alice, Bob"
          />
        </div>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : member ? 'Save changes' : 'Add member'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
