'use server'

import { revalidatePath } from 'next/cache'
import { createAccount, updateAccount, deleteAccount } from '@/lib/dal/accounts'

export type AccountActionState = { error?: string; success?: boolean }

export async function createAccountAction(
  _prevState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const name = formData.get('name')?.toString().trim()
  const balancePounds = formData.get('balancePounds')?.toString()

  if (!name) return { error: 'Account name is required' }

  const balancePence = Math.round(parseFloat(balancePounds ?? '0') * 100)
  if (isNaN(balancePence)) return { error: 'Enter a valid balance amount' }

  try {
    await createAccount(name, balancePence)
    revalidatePath('/accounts')
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
  const balancePounds = formData.get('balancePounds')?.toString()

  if (!name) return { error: 'Account name is required' }
  if (!id || isNaN(id)) return { error: 'Invalid account' }

  const balancePence = Math.round(parseFloat(balancePounds ?? '0') * 100)
  if (isNaN(balancePence)) return { error: 'Enter a valid balance amount' }

  try {
    await updateAccount(id, name, balancePence)
    revalidatePath('/accounts')
    return { success: true }
  } catch {
    return { error: 'Failed to save account. Please try again.' }
  }
}

export async function deleteAccountAction(id: number): Promise<AccountActionState> {
  try {
    await deleteAccount(id)
    revalidatePath('/accounts')
    return { success: true }
  } catch {
    return { error: 'Failed to delete account. Please try again.' }
  }
}
