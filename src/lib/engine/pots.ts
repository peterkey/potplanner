import Decimal from 'decimal.js'
import type { Pot } from './types'

/**
 * Sums the allocated pence across all pots using Decimal arithmetic.
 */
export function sumPotAllocations(pots: Pot[]): number {
  return pots.reduce((acc, p) => acc.plus(p.allocatedPence), new Decimal(0)).toNumber()
}

/**
 * Validates that pot allocations do not exceed the available income.
 *
 * Returns:
 * - { valid: true, remaining: number } when allocations fit within income
 * - { valid: false, overAllocatedPence: number } when allocations exceed income
 */
export function validatePotAllocations(
  incomePence: number,
  pots: Pot[]
): { valid: boolean; remaining?: number; overAllocatedPence?: number } {
  const total = sumPotAllocations(pots)
  if (total <= incomePence) {
    return { valid: true, remaining: incomePence - total }
  }
  return { valid: false, overAllocatedPence: total - incomePence }
}

/**
 * Calculates the remaining balance of a pot given its allocation and amount spent.
 * Result can be negative if the pot is overspent.
 */
export function getPotBalance(allocatedPence: number, spentPence: number): number {
  return new Decimal(allocatedPence).minus(spentPence).toNumber()
}
