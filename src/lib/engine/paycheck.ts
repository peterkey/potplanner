import { addDays, addMonths } from 'date-fns'
import { getBillOccurrences } from './bills'
import type { Bill, PayFrequency } from './types'

export type { PayFrequency }

export const PAY_FREQUENCY_LABELS: Record<PayFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  four_weekly: 'Every 4 weeks',
  monthly: 'Monthly',
}

export interface Pot {
  id: number
  name: string
  accountId: number | null
}

export interface Account {
  id: number
  name: string
}

export interface BillInWindow {
  billId: number
  name: string
  dueDate: Date
  amountPence: number
}

export interface PotPayAllocation {
  potId: number
  potName: string
  bills: BillInWindow[]
  totalPence: number
}

export interface AccountPayAllocation {
  accountId: number
  accountName: string
  pots: PotPayAllocation[]
  directBills: BillInWindow[]
  totalPence: number
}

export interface PayWindowResult {
  windowStart: Date
  windowEnd: Date
  accountAllocations: AccountPayAllocation[]
  unassignedPots: PotPayAllocation[]
  unlinkedBills: BillInWindow[]
  totalNeededPence: number
}

export function getPrevPayDate(nextPayDate: Date, frequency: PayFrequency): Date {
  switch (frequency) {
    case 'weekly':      return addDays(nextPayDate, -7)
    case 'biweekly':    return addDays(nextPayDate, -14)
    case 'four_weekly': return addDays(nextPayDate, -28)
    case 'monthly':     return addMonths(nextPayDate, -1)
  }
}

export function getCurrentPayWindow(
  referencePayDate: Date,
  frequency: PayFrequency,
): { windowStart: Date; windowEnd: Date } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let candidate = new Date(referencePayDate)
  candidate.setHours(0, 0, 0, 0)

  // Walk backward until candidate is on or before today
  while (candidate > today) {
    candidate = getPrevPayDate(candidate, frequency)
  }

  // Walk forward to find the window whose end is still in the future (i.e. today is inside it)
  let windowStart = candidate
  let windowEnd = getWindowEnd(windowStart, frequency)
  while (windowEnd <= today) {
    windowStart = windowEnd
    windowEnd = getWindowEnd(windowStart, frequency)
  }

  return { windowStart, windowEnd }
}

export function getWindowEnd(from: Date, frequency: PayFrequency): Date {
  switch (frequency) {
    case 'weekly':     return addDays(from, 7)
    case 'biweekly':   return addDays(from, 14)
    case 'four_weekly': return addDays(from, 28)
    case 'monthly':    return addMonths(from, 1)
  }
}

export function calculatePayWindowAllocations(
  windowStart: Date,
  frequency: PayFrequency,
  accounts: Account[],
  pots: Pot[],
  bills: Bill[],
  windowEndOverride?: Date,
): PayWindowResult {
  const windowEnd = windowEndOverride ?? getWindowEnd(windowStart, frequency)

  // Find bills occurring in the window
  const billsInWindow: Array<BillInWindow & { potId: number | null; accountId: number | null }> = []
  for (const bill of bills) {
    const occurrences = getBillOccurrences(bill, windowStart, windowEnd)
    for (const dueDate of occurrences) {
      billsInWindow.push({ billId: bill.id, name: bill.name, dueDate, amountPence: bill.amountPence, potId: bill.potId, accountId: bill.accountId ?? null })
    }
  }

  // Group by pot
  const potMap = new Map<number, PotPayAllocation>()
  for (const pot of pots) {
    potMap.set(pot.id, { potId: pot.id, potName: pot.name, bills: [], totalPence: 0 })
  }

  // Group pots by account (build account map first so direct bills can be added)
  const accountMap = new Map<number, AccountPayAllocation>()
  for (const account of accounts) {
    accountMap.set(account.id, { accountId: account.id, accountName: account.name, pots: [], directBills: [], totalPence: 0 })
  }

  const unlinkedBills: BillInWindow[] = []
  for (const bill of billsInWindow) {
    if (bill.potId !== null && potMap.has(bill.potId)) {
      const potAlloc = potMap.get(bill.potId)!
      potAlloc.bills.push({ billId: bill.billId, name: bill.name, dueDate: bill.dueDate, amountPence: bill.amountPence })
      potAlloc.totalPence += bill.amountPence
    } else if (bill.accountId !== null && accountMap.has(bill.accountId)) {
      const acctAlloc = accountMap.get(bill.accountId)!
      acctAlloc.directBills.push({ billId: bill.billId, name: bill.name, dueDate: bill.dueDate, amountPence: bill.amountPence })
      acctAlloc.totalPence += bill.amountPence
    } else {
      unlinkedBills.push({ billId: bill.billId, name: bill.name, dueDate: bill.dueDate, amountPence: bill.amountPence })
    }
  }

  const unassignedPots: PotPayAllocation[] = []
  for (const pot of pots) {
    const alloc = potMap.get(pot.id)!
    if (pot.accountId !== null && accountMap.has(pot.accountId)) {
      const acctAlloc = accountMap.get(pot.accountId)!
      acctAlloc.pots.push(alloc)
      acctAlloc.totalPence += alloc.totalPence
    } else {
      unassignedPots.push(alloc)
    }
  }

  // Include accounts that have pots OR direct bills
  const accountAllocations = [...accountMap.values()].filter((a) => a.pots.length > 0 || a.directBills.length > 0)

  const totalNeededPence =
    accountAllocations.reduce((s, a) => s + a.totalPence, 0) +
    unassignedPots.reduce((s, p) => s + p.totalPence, 0) +
    unlinkedBills.reduce((s, b) => s + b.amountPence, 0)

  return { windowStart, windowEnd, accountAllocations, unassignedPots, unlinkedBills, totalNeededPence }
}
