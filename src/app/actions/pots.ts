'use server'

import { revalidatePath } from 'next/cache'
import { createPot, updatePot, deletePot, resetAllPotAllocations, updatePotAllocation } from '@/lib/dal/pots'
import { resetAllBillsPaid } from '@/lib/dal/bills'

export type PotActionState = { error?: string; success?: boolean }

export async function createPotAction(
  _prevState: PotActionState,
  formData: FormData
): Promise<PotActionState> {
  const name = formData.get('name')?.toString().trim()
  const allocationPounds = formData.get('allocationPounds')?.toString()
  const rollover = formData.get('rollover') === 'on'

  if (!name) return { error: 'Pot name is required' }

  const allocatedPence = Math.round(parseFloat(allocationPounds ?? '0') * 100)
  if (isNaN(allocatedPence)) return { error: 'Enter a valid allocation amount' }

  try {
    await createPot(name, allocatedPence, rollover)
    revalidatePath('/pots')
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

  if (!name) return { error: 'Pot name is required' }
  if (!id || isNaN(id)) return { error: 'Invalid pot' }

  const allocatedPence = Math.round(parseFloat(allocationPounds ?? '0') * 100)
  if (isNaN(allocatedPence)) return { error: 'Enter a valid allocation amount' }

  try {
    await updatePot(id, name, allocatedPence, rollover)
    revalidatePath('/pots')
    return { success: true }
  } catch {
    return { error: 'Failed to save pot. Please try again.' }
  }
}

export async function deletePotAction(id: number): Promise<PotActionState> {
  try {
    await deletePot(id)
    revalidatePath('/pots')
    return { success: true }
  } catch {
    return { error: 'Failed to delete pot. Please try again.' }
  }
}

export async function resetPotAllocationsAction(): Promise<PotActionState> {
  try {
    await resetAllPotAllocations()
    await resetAllBillsPaid()
    revalidatePath('/pots')
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
    return { success: true }
  } catch {
    return { error: 'Failed to update allocation. Please try again.' }
  }
}
