import Decimal from 'decimal.js'
import type { Bill, Pot, IncomeValidation } from './types'
import { getMonthlyBillCost } from './bills'

/**
 * Validates an income value in pence.
 * Must be a non-negative finite integer.
 */
export function validateIncome(pence: number): IncomeValidation {
  if (!Number.isFinite(pence) || !Number.isInteger(pence) || pence < 0) {
    return { valid: false, error: 'Income must be a non-negative integer' }
  }
  return { valid: true, value: pence }
}

/**
 * Calculates disposable income in pence using Decimal arithmetic to avoid
 * float accumulation errors.
 *
 * Result can be negative if pots + bills exceed income — this is intentional
 * and must NOT be clamped.
 */
export function calculateDisposableIncome(
  incomePence: number,
  pots: Pot[],
  bills: Bill[],
  year: number,
  month: number
): number {
  const income = new Decimal(incomePence)
  const potTotal = pots.reduce((acc, p) => acc.plus(p.allocatedPence), new Decimal(0))
  const billTotal = bills.reduce(
    (acc, b) => acc.plus(getMonthlyBillCost(b, year, month)),
    new Decimal(0)
  )
  return income.minus(potTotal).minus(billTotal).toNumber()
}
