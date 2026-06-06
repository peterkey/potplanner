'use server'

import { revalidatePath } from 'next/cache'
import {
  createBill,
  updateBill,
  deleteBill,
  markBillPaid,
  markBillUnpaid,
} from '@/lib/dal/bills'
import type { BillFrequency } from '@/lib/engine/types'

export type BillActionState = { error?: string; success?: boolean }

const VALID_FREQUENCIES: BillFrequency[] = ['weekly', 'biweekly', 'four_weekly', 'monthly', 'annual']

function parseSplits(splitsJson: string | null) {
  if (!splitsJson) return []
  try {
    const parsed = JSON.parse(splitsJson)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (s) =>
        typeof s.memberName === 'string' &&
        s.memberName.trim() &&
        typeof s.percentage === 'number' &&
        s.percentage > 0
    )
  } catch {
    return []
  }
}

export async function createBillAction(
  _prevState: BillActionState,
  formData: FormData
): Promise<BillActionState> {
  const name = formData.get('name')?.toString().trim()
  const amountPounds = formData.get('amountPounds')?.toString()
  const frequency = formData.get('frequency')?.toString()
  const potIdStr = formData.get('potId')?.toString()
  const accountIdStr = formData.get('accountId')?.toString()
  const dueDateStr = formData.get('nextDueDate')?.toString()
  const splitsJson = formData.get('splits')?.toString() ?? null

  if (!name) return { error: 'Bill name is required' }
  if (!frequency || !VALID_FREQUENCIES.includes(frequency as BillFrequency))
    return { error: 'Select a valid frequency' }
  if (!dueDateStr) return { error: 'Due date is required' }

  const amountPence = Math.round(parseFloat(amountPounds ?? '0') * 100)
  if (isNaN(amountPence) || amountPence <= 0) return { error: 'Enter a valid amount' }

  const potId = potIdStr && potIdStr !== 'none' ? parseInt(potIdStr) : null
  const accountId = accountIdStr && accountIdStr !== 'none' ? parseInt(accountIdStr) : null
  if (!potId && !accountId) return { error: 'Select an account or pot for this bill' }

  const nextDueDate = new Date(dueDateStr)
  if (isNaN(nextDueDate.getTime())) return { error: 'Enter a valid due date' }

  try {
    await createBill(
      name,
      amountPence,
      frequency as BillFrequency,
      potId,
      accountId,
      nextDueDate,
      parseSplits(splitsJson)
    )
    revalidatePath('/bills')
    revalidatePath('/accounts')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Failed to save bill. Please try again.' }
  }
}

export async function updateBillAction(
  _prevState: BillActionState,
  formData: FormData
): Promise<BillActionState> {
  const id = Number(formData.get('id'))
  const name = formData.get('name')?.toString().trim()
  const amountPounds = formData.get('amountPounds')?.toString()
  const frequency = formData.get('frequency')?.toString()
  const potIdStr = formData.get('potId')?.toString()
  const accountIdStr = formData.get('accountId')?.toString()
  const dueDateStr = formData.get('nextDueDate')?.toString()
  const splitsJson = formData.get('splits')?.toString() ?? null

  if (!id || isNaN(id)) return { error: 'Invalid bill' }
  if (!name) return { error: 'Bill name is required' }
  if (!frequency || !VALID_FREQUENCIES.includes(frequency as BillFrequency))
    return { error: 'Select a valid frequency' }
  if (!dueDateStr) return { error: 'Due date is required' }

  const amountPence = Math.round(parseFloat(amountPounds ?? '0') * 100)
  if (isNaN(amountPence) || amountPence <= 0) return { error: 'Enter a valid amount' }

  const potId = potIdStr && potIdStr !== 'none' ? parseInt(potIdStr) : null
  const accountId = accountIdStr && accountIdStr !== 'none' ? parseInt(accountIdStr) : null
  if (!potId && !accountId) return { error: 'Select an account or pot for this bill' }

  const nextDueDate = new Date(dueDateStr)
  if (isNaN(nextDueDate.getTime())) return { error: 'Enter a valid due date' }

  try {
    await updateBill(
      id,
      name,
      amountPence,
      frequency as BillFrequency,
      potId,
      accountId,
      nextDueDate,
      parseSplits(splitsJson)
    )
    revalidatePath('/bills')
    revalidatePath('/accounts')
    return { success: true }
  } catch {
    return { error: 'Failed to save bill. Please try again.' }
  }
}

export async function deleteBillAction(id: number): Promise<BillActionState> {
  try {
    await deleteBill(id)
    revalidatePath('/bills')
    revalidatePath('/accounts')
    return { success: true }
  } catch {
    return { error: 'Failed to delete bill. Please try again.' }
  }
}

export async function markBillPaidAction(id: number): Promise<BillActionState> {
  try {
    await markBillPaid(id)
    revalidatePath('/bills')
    revalidatePath('/accounts')
    revalidatePath('/history')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Failed to mark bill as paid.' }
  }
}

export async function markBillUnpaidAction(id: number): Promise<BillActionState> {
  try {
    await markBillUnpaid(id)
    revalidatePath('/bills')
    revalidatePath('/accounts')
    revalidatePath('/history')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Failed to mark bill as unpaid.' }
  }
}
