'use server'

import { revalidatePath } from 'next/cache'
import { createSavingsGoal, updateSavingsGoal, deleteSavingsGoal } from '@/lib/dal/savings-goals'

export type SavingsGoalActionState = { error?: string; success?: boolean }

export async function createSavingsGoalAction(
  _prevState: SavingsGoalActionState,
  formData: FormData
): Promise<SavingsGoalActionState> {
  const name = formData.get('name')?.toString().trim()
  const targetPounds = formData.get('targetPounds')?.toString()
  const potIdStr = formData.get('potId')?.toString()

  if (!name) return { error: 'Goal name is required' }

  const targetPence = Math.round(parseFloat(targetPounds ?? '0') * 100)
  if (isNaN(targetPence) || targetPence <= 0) return { error: 'Enter a valid target amount' }

  const potId = potIdStr && potIdStr !== 'none' ? parseInt(potIdStr) : null

  try {
    await createSavingsGoal(name, targetPence, potId)
    revalidatePath('/savings')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Failed to save goal. Please try again.' }
  }
}

export async function updateSavingsGoalAction(
  _prevState: SavingsGoalActionState,
  formData: FormData
): Promise<SavingsGoalActionState> {
  const id = Number(formData.get('id'))
  const name = formData.get('name')?.toString().trim()
  const targetPounds = formData.get('targetPounds')?.toString()
  const potIdStr = formData.get('potId')?.toString()

  if (!id || isNaN(id)) return { error: 'Invalid goal' }
  if (!name) return { error: 'Goal name is required' }

  const targetPence = Math.round(parseFloat(targetPounds ?? '0') * 100)
  if (isNaN(targetPence) || targetPence <= 0) return { error: 'Enter a valid target amount' }

  const potId = potIdStr && potIdStr !== 'none' ? parseInt(potIdStr) : null

  try {
    await updateSavingsGoal(id, name, targetPence, potId)
    revalidatePath('/savings')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Failed to save goal. Please try again.' }
  }
}

export async function deleteSavingsGoalAction(id: number): Promise<SavingsGoalActionState> {
  try {
    await deleteSavingsGoal(id)
    revalidatePath('/savings')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Failed to delete goal. Please try again.' }
  }
}
