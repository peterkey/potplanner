'use server'

import { revalidatePath } from 'next/cache'
import { createAccount, updateAccount, deleteAccount } from '@/lib/dal/accounts'

export type AccountActionState = { error?: string; success?: boolean }

function parseShares(sharesJson: string | null): Array<{ memberId: number; defaultPercentage: number }> {
  if (!sharesJson) return []
  try {
    const parsed = JSON.parse(sharesJson)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (s) => typeof s.memberId === 'number' && typeof s.defaultPercentage === 'number' && s.defaultPercentage > 0
    )
  } catch {
    return []
  }
}

export async function createAccountAction(
  _prevState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const name = formData.get('name')?.toString().trim()
  const ownerIdStr = formData.get('ownerId')?.toString()
  const sharesJson = formData.get('shares')?.toString() ?? null

  if (!name) return { error: 'Account name is required' }
  const ownerId = ownerIdStr && ownerIdStr !== 'none' ? Number(ownerIdStr) : null
  if (!ownerId) return { error: 'Owner is required' }

  const shares = parseShares(sharesJson)
  const total = shares.reduce((s, r) => s + r.defaultPercentage, 0)
  if (shares.length > 0 && total !== 100) return { error: 'Split percentages must add up to 100%' }

  try {
    await createAccount(name, 0, ownerId, shares)
    revalidatePath('/accounts')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Failed to save account. Please try again.' }
  }
}

export async function updateAccountAction(
  _prevState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const id = Number(formData.get('id'))
  const name = formData.get('name')?.toString().trim()
  const ownerIdStr = formData.get('ownerId')?.toString()
  const sharesJson = formData.get('shares')?.toString() ?? null

  if (!name) return { error: 'Account name is required' }
  if (!id || isNaN(id)) return { error: 'Invalid account' }
  const ownerId = ownerIdStr && ownerIdStr !== 'none' ? Number(ownerIdStr) : null
  if (!ownerId) return { error: 'Owner is required' }

  const shares = parseShares(sharesJson)
  const total = shares.reduce((s, r) => s + r.defaultPercentage, 0)
  if (shares.length > 0 && total !== 100) return { error: 'Split percentages must add up to 100%' }

  try {
    await updateAccount(id, name, 0, ownerId, shares)
    revalidatePath('/accounts')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Failed to save account. Please try again.' }
  }
}

export async function deleteAccountAction(id: number): Promise<AccountActionState> {
  try {
    await deleteAccount(id)
    revalidatePath('/accounts')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Failed to delete account. Please try again.' }
  }
}
