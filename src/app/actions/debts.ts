'use server'

import { revalidatePath } from 'next/cache'
import { createDebt, updateDebt, deleteDebt } from '@/lib/dal/debts'

export type DebtActionState = { error?: string; success?: boolean }

export async function createDebtAction(
  _prevState: DebtActionState,
  formData: FormData
): Promise<DebtActionState> {
  const name = formData.get('name')?.toString().trim()
  const balancePounds = formData.get('balancePounds')?.toString()
  const interestRateStr = formData.get('interestRate')?.toString()
  const minimumPaymentPounds = formData.get('minimumPaymentPounds')?.toString()

  if (!name) return { error: 'Debt name is required' }

  const balancePence = Math.round(parseFloat(balancePounds ?? '0') * 100)
  if (isNaN(balancePence) || balancePence <= 0) return { error: 'Enter a valid balance' }

  // interestRate stored as basis points (e.g. 25.50% → 2550)
  const interestRate = Math.round(parseFloat(interestRateStr ?? '0') * 100)
  if (isNaN(interestRate) || interestRate < 0) return { error: 'Enter a valid interest rate' }

  const minimumPaymentPence = Math.round(parseFloat(minimumPaymentPounds ?? '0') * 100)
  if (isNaN(minimumPaymentPence) || minimumPaymentPence <= 0)
    return { error: 'Enter a valid minimum payment' }

  try {
    await createDebt(name, balancePence, interestRate, minimumPaymentPence)
    revalidatePath('/debts')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Failed to save debt. Please try again.' }
  }
}

export async function updateDebtAction(
  _prevState: DebtActionState,
  formData: FormData
): Promise<DebtActionState> {
  const id = Number(formData.get('id'))
  const name = formData.get('name')?.toString().trim()
  const balancePounds = formData.get('balancePounds')?.toString()
  const interestRateStr = formData.get('interestRate')?.toString()
  const minimumPaymentPounds = formData.get('minimumPaymentPounds')?.toString()

  if (!id || isNaN(id)) return { error: 'Invalid debt' }
  if (!name) return { error: 'Debt name is required' }

  const balancePence = Math.round(parseFloat(balancePounds ?? '0') * 100)
  if (isNaN(balancePence) || balancePence <= 0) return { error: 'Enter a valid balance' }

  const interestRate = Math.round(parseFloat(interestRateStr ?? '0') * 100)
  if (isNaN(interestRate) || interestRate < 0) return { error: 'Enter a valid interest rate' }

  const minimumPaymentPence = Math.round(parseFloat(minimumPaymentPounds ?? '0') * 100)
  if (isNaN(minimumPaymentPence) || minimumPaymentPence <= 0)
    return { error: 'Enter a valid minimum payment' }

  try {
    await updateDebt(id, name, balancePence, interestRate, minimumPaymentPence)
    revalidatePath('/debts')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Failed to save debt. Please try again.' }
  }
}

export async function deleteDebtAction(id: number): Promise<DebtActionState> {
  try {
    await deleteDebt(id)
    revalidatePath('/debts')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Failed to delete debt. Please try again.' }
  }
}
