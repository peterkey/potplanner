import { addDays, addMonths, addYears, endOfMonth } from 'date-fns'
import Decimal from 'decimal.js'
import type { Bill, BillFrequency, BillOccurrence } from './types'

/**
 * Advances a date by one period of the given frequency.
 * For monthly/annual: date-fns handles month-end clamping automatically.
 */
export function advanceByFrequency(date: Date, frequency: BillFrequency): Date {
  switch (frequency) {
    case 'weekly':
      return addDays(date, 7)
    case 'biweekly':
      return addDays(date, 14)
    case 'four_weekly':
      return addDays(date, 28)
    case 'monthly':
      return addMonths(date, 1)
    case 'annual':
      return addYears(date, 1)
  }
}

/**
 * Returns all due dates for a bill within [startDate, endDate] (inclusive).
 *
 * For monthly and annual frequencies, uses the STABLE BASELINE pattern:
 * each occurrence is computed as addMonths(originalNextDueDate, i) or
 * addYears(originalNextDueDate, i) — NEVER chaining from the previous
 * occurrence. This prevents date drift (e.g. Jan 31 -> Feb 28 -> Mar 28
 * instead of the correct Mar 31).
 *
 * For day-based frequencies (weekly, biweekly, four_weekly), chaining is
 * safe because addDays is exact and cannot drift.
 */
export function getBillOccurrences(bill: Bill, startDate: Date, endDate: Date): Date[] {
  const occurrences: Date[] = []
  const base = new Date(bill.nextDueDate)

  if (bill.frequency === 'monthly' || bill.frequency === 'annual') {
    // Period-count approach: avoids drift from repeated addMonths on clamped dates.
    // Compute candidate as addMonths/addYears from the ORIGINAL base date.
    let i = 0
    while (true) {
      const candidate =
        bill.frequency === 'monthly' ? addMonths(base, i) : addYears(base, i)

      if (candidate > endDate) break

      if (candidate >= startDate) {
        occurrences.push(new Date(candidate))
      }

      i++
    }
  } else {
    // Day-based frequencies: advance until reaching startDate, then collect.
    let current = new Date(base)

    // Skip occurrences before startDate
    while (current < startDate) {
      current = advanceByFrequency(current, bill.frequency)
    }

    // Collect occurrences within range
    while (current <= endDate) {
      occurrences.push(new Date(current))
      current = advanceByFrequency(current, bill.frequency)
    }
  }

  return occurrences
}

/**
 * Returns the total pence cost of a bill for a given calendar month.
 * Uses actual occurrence counting — not 52/12 annualization.
 *
 * month is 1-indexed (January = 1).
 */
export function getMonthlyBillCost(bill: Bill, year: number, month: number): number {
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = endOfMonth(monthStart) // 23:59:59.999 — correct for <= comparison

  const occurrences = getBillOccurrences(bill, monthStart, monthEnd)

  return occurrences
    .reduce((acc, _) => acc.plus(bill.amountPence), new Decimal(0))
    .toNumber()
}

/**
 * Creates a BillOccurrence from a Bill and a due date.
 * Useful for building forecast output.
 */
export function toBillOccurrence(bill: Bill, dueDate: Date): BillOccurrence {
  return {
    billId: bill.id,
    name: bill.name,
    amountPence: bill.amountPence,
    dueDate,
    potId: bill.potId,
  }
}
