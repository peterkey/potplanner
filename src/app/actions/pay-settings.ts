'use server'

import { revalidatePath } from 'next/cache'
import { upsertPaySettings } from '@/lib/dal/pay-settings'
import type { PayFrequency } from '@/lib/engine/paycheck'

const VALID_FREQUENCIES: PayFrequency[] = ['weekly', 'biweekly', 'four_weekly', 'monthly']

export type PaySettingsState = { error?: string; success?: boolean }

export async function savePaySettingsAction(
  _prevState: PaySettingsState,
  formData: FormData
): Promise<PaySettingsState> {
  const amountPounds = formData.get('amountPounds')?.toString()
  const frequency = formData.get('frequency')?.toString()
  const nextPayDateStr = formData.get('nextPayDate')?.toString()

  if (!frequency || !VALID_FREQUENCIES.includes(frequency as PayFrequency))
    return { error: 'Select a valid pay frequency' }
  if (!nextPayDateStr) return { error: 'Next pay date is required' }

  const amountPence = Math.round(parseFloat(amountPounds ?? '0') * 100)
  if (isNaN(amountPence) || amountPence <= 0) return { error: 'Enter a valid pay amount' }

  const nextPayDate = new Date(nextPayDateStr)
  if (isNaN(nextPayDate.getTime())) return { error: 'Enter a valid date' }

  try {
    await upsertPaySettings(amountPence, frequency, nextPayDate)
    revalidatePath('/')
    revalidatePath('/pay')
    return { success: true }
  } catch {
    return { error: 'Failed to save settings. Please try again.' }
  }
}
