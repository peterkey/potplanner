'use server'

import { revalidatePath } from 'next/cache'
import { createPot, updatePot, deletePot, resetAllPotAllocations, updatePotAllocation } from '@/lib/dal/pots'

export type PotActionState = { error?: string; success?: boolean }

export async function createPotAction(
  _prevState: PotActionState,
  formData: FormData
): Promise<PotActionState> {
  const name = formData.get('name')?.toString().trim()
  const allocationPounds = formData.get('allocationPounds')?.toString()
  const rollover = formData.get('rollover') === 'on'
  const accountIdStr = formData.get('accountId')?.toString()

  if (!name) return { error: 'Pot name is required' }

  const allocatedPence = Math.round(parseFloat(allocationPounds ?? '0') * 100)
  if (isNaN(allocatedPence)) return { error: 'Enter a valid allocation amount' }

  const accountId = accountIdStr && accountIdStr !== '' && accountIdStr !== 'none' ? Number(accountIdStr) : null

  try {
    await createPot(name, allocatedPence, rollover, accountId)
    revalidatePath('/pots')
    revalidatePath('/accounts')
    return { success: true }
  } catch {
    return { error: 'Failed to save pot. Please try again.' }
  }
}

export async function updatePotAction(
  _prevState: PotActionState,
  formData: FormData
): Promise<PotActionState> {
  const id = Number(formData.get('id'))
  const name = formData.get('name')?.toString().trim()
  const allocationPounds = formData.get('allocationPounds')?.toString()
  const rollover = formData.get('rollover') === 'on'
  const accountIdStr = formData.get('accountId')?.toString()

  if (!name) return { error: 'Pot name is required' }
  if (!id || isNaN(id)) return { error: 'Invalid pot' }

  const allocatedPence = Math.round(parseFloat(allocationPounds ?? '0') * 100)
  if (isNaN(allocatedPence)) return { error: 'Enter a valid allocation amount' }

  const accountId = accountIdStr && accountIdStr !== '' && accountIdStr !== 'none' ? Number(accountIdStr) : null

  try {
    await updatePot(id, name, allocatedPence, rollover, accountId)
    revalidatePath('/pots')
    revalidatePath('/accounts')
    return { success: true }
  } catch {
    return { error: 'Failed to save pot. Please try again.' }
  }
}

export async function deletePotAction(id: number): Promise<PotActionState> {
  try {
    await deletePot(id)
    revalidatePath('/pots')
    revalidatePath('/accounts')
    return { success: true }
  } catch {
    return { error: 'Failed to delete pot. Please try again.' }
  }
}

export async function resetPotAllocationsAction(): Promise<PotActionState> {
  try {
    await resetAllPotAllocations()
    revalidatePath('/pots')
    revalidatePath('/accounts')
    revalidatePath('/bills')
    return { success: true }
  } catch {
    return { error: 'Failed to reset allocations. Please try again.' }
  }
}

export async function updatePotAllocationAction(
  id: number,
  allocationPounds: string
): Promise<PotActionState> {
  const allocatedPence = Math.round(parseFloat(allocationPounds || '0') * 100)
  if (isNaN(allocatedPence) || allocatedPence < 0) {
    return { error: 'Enter a valid allocation amount' }
  }

  try {
    await updatePotAllocation(id, allocatedPence)
    revalidatePath('/pots')
    revalidatePath('/accounts')
    return { success: true }
  } catch {
    return { error: 'Failed to update allocation. Please try again.' }
  }
}
