'use server'

import { revalidatePath } from 'next/cache'
import {
  createHouseholdMember,
  updateHouseholdMember,
  deleteHouseholdMember,
} from '@/lib/dal/household-members'

export type MemberActionState = { error?: string; success?: boolean }

export async function createMemberAction(
  _prevState: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const name = formData.get('name')?.toString().trim()
  if (!name) return { error: 'Name is required' }

  try {
    await createHouseholdMember(name)
    revalidatePath('/household')
    revalidatePath('/accounts')
    revalidatePath('/bills')
    return { success: true }
  } catch {
    return { error: 'Failed to save member. Please try again.' }
  }
}

export async function updateMemberAction(
  _prevState: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const id = Number(formData.get('id'))
  const name = formData.get('name')?.toString().trim()

  if (!id || isNaN(id)) return { error: 'Invalid member' }
  if (!name) return { error: 'Name is required' }

  try {
    await updateHouseholdMember(id, name)
    revalidatePath('/household')
    revalidatePath('/accounts')
    revalidatePath('/bills')
    return { success: true }
  } catch {
    return { error: 'Failed to save member. Please try again.' }
  }
}

export async function deleteMemberAction(id: number): Promise<MemberActionState> {
  try {
    await deleteHouseholdMember(id)
    revalidatePath('/household')
    revalidatePath('/accounts')
    revalidatePath('/bills')
    return { success: true }
  } catch {
    return { error: 'Failed to delete member. Please try again.' }
  }
}
