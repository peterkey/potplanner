'use server'

import { revalidatePath } from 'next/cache'
import { createIncome, updateIncome, deleteIncome } from '@/lib/dal/incomes'
import type { PayFrequency } from '@/lib/engine/paycheck'

const VALID_FREQUENCIES: PayFrequency[] = ['weekly', 'biweekly', 'four_weekly', 'monthly']

export type IncomeFormState = { error?: string; success?: boolean }

export async function createIncomeAction(
  _prevState: IncomeFormState,
  formData: FormData,
): Promise<IncomeFormState> {
  return saveIncome(null, formData)
}

export async function updateIncomeAction(
  _prevState: IncomeFormState,
  formData: FormData,
): Promise<IncomeFormState> {
  const id = parseInt(formData.get('id')?.toString() ?? '')
  if (isNaN(id)) return { error: 'Invalid income ID' }
  return saveIncome(id, formData)
}

async function saveIncome(id: number | null, formData: FormData): Promise<IncomeFormState> {
  const name = formData.get('name')?.toString().trim()
  const amountPounds = formData.get('amountPounds')?.toString()
  const frequency = formData.get('frequency')?.toString()
  const nextPayDateStr = formData.get('nextPayDate')?.toString()
  const memberIdStr = formData.get('memberId')?.toString()

  if (!name) return { error: 'Name is required' }
  if (!frequency || !VALID_FREQUENCIES.includes(frequency as PayFrequency))
    return { error: 'Select a valid pay frequency' }
  if (!nextPayDateStr) return { error: 'Next pay date is required' }

  const amountPence = Math.round(parseFloat(amountPounds ?? '0') * 100)
  if (isNaN(amountPence) || amountPence <= 0) return { error: 'Enter a valid pay amount' }

  const nextPayDate = new Date(nextPayDateStr)
  if (isNaN(nextPayDate.getTime())) return { error: 'Enter a valid date' }

  const memberId = memberIdStr && memberIdStr !== 'none' ? parseInt(memberIdStr) : null

  try {
    if (id === null) {
      await createIncome(name, amountPence, frequency, nextPayDate, memberId)
    } else {
      await updateIncome(id, name, amountPence, frequency, nextPayDate, memberId)
    }
    revalidatePath('/')
    revalidatePath('/pay')
    return { success: true }
  } catch {
    return { error: 'Failed to save. Please try again.' }
  }
}

export async function deleteIncomeAction(id: number): Promise<void> {
  await deleteIncome(id)
  revalidatePath('/')
  revalidatePath('/pay')
}
