'use server'

import { revalidatePath } from 'next/cache'
import { createSavingsGoal, updateSavingsGoal, deleteSavingsGoal } from '@/lib/dal/savings-goals'

export type SavingsGoalActionState = { error?: string; success?: boolean }

function parseContributors(formData: FormData): Array<{ memberId: number; percentage: number }> {
  const raw = formData.get('contributors')?.toString()
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (c) => typeof c.memberId === 'number' && typeof c.percentage === 'number' && c.percentage > 0
    )
  } catch {
    return []
  }
}

function parseGoalDate(formData: FormData): Date | null {
  const raw = formData.get('goalDate')?.toString()
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

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
  const goalDate = parseGoalDate(formData)
  const contributors = parseContributors(formData)

  if (contributors.length === 0) return { error: 'Add at least one contributor' }

  try {
    await createSavingsGoal(name, targetPence, goalDate, potId, contributors)
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
  const goalDate = parseGoalDate(formData)
  const contributors = parseContributors(formData)

  if (contributors.length === 0) return { error: 'Add at least one contributor' }

  try {
    await updateSavingsGoal(id, name, targetPence, goalDate, potId, contributors)
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
