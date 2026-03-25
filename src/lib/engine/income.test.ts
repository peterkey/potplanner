import { describe, it, expect } from 'vitest'
import { validateIncome, calculateDisposableIncome } from '@/lib/engine/income'
import type { Bill, Pot } from '@/lib/engine/types'

// Helper to build a Bill with sensible defaults
function makeBill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: 1,
    name: 'Test Bill',
    amountPence: 10000,
    frequency: 'monthly',
    potId: null,
    nextDueDate: new Date(2026, 0, 15), // 15th Jan 2026
    ...overrides,
  }
}

// Helper to build a Pot with sensible defaults
function makePot(allocatedPence: number, overrides: Partial<Pot> = {}): Pot {
  return {
    id: 1,
    name: 'Test Pot',
    allocatedPence,
    rollover: false,
    ...overrides,
  }
}

describe('validateIncome', () => {
  it('returns valid for a positive integer pence value', () => {
    const result = validateIncome(250000)
    expect(result).toEqual({ valid: true, value: 250000 })
  })

  it('returns valid for zero income', () => {
    const result = validateIncome(0)
    expect(result).toEqual({ valid: true, value: 0 })
  })

  it('returns invalid for negative pence value', () => {
    const result = validateIncome(-100)
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns invalid for non-integer value (float)', () => {
    const result = validateIncome(100.5)
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns invalid for NaN', () => {
    const result = validateIncome(NaN)
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns invalid for Infinity', () => {
    const result = validateIncome(Infinity)
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns invalid for -Infinity', () => {
    const result = validateIncome(-Infinity)
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('calculateDisposableIncome', () => {
  it('returns full income when no pots and no bills', () => {
    const result = calculateDisposableIncome(250000, [], [], 2026, 1)
    expect(result).toBe(250000)
  })

  it('subtracts a single pot allocation from income', () => {
    const pots = [makePot(100000)]
    const result = calculateDisposableIncome(250000, pots, [], 2026, 1)
    expect(result).toBe(150000)
  })

  it('subtracts multiple pot allocations from income', () => {
    const pots = [makePot(80000), makePot(60000, { id: 2 })]
    const result = calculateDisposableIncome(250000, pots, [], 2026, 1)
    expect(result).toBe(110000)
  })

  it('returns negative disposable income when over-allocated (NOT clamped)', () => {
    const pots = [makePot(200000)]
    const bills = [makeBill({ amountPence: 100000 })]
    const result = calculateDisposableIncome(250000, pots, bills, 2026, 1)
    expect(result).toBe(-50000)
  })

  it('returns negative when zero income with pot allocations', () => {
    const pots = [makePot(50000)]
    const result = calculateDisposableIncome(0, pots, [], 2026, 1)
    expect(result).toBe(-50000)
  })

  it('handles large values near 32-bit integer limit', () => {
    const result = calculateDisposableIncome(2100000000, [], [], 2026, 1)
    expect(result).toBe(2100000000)
  })

  it('correctly subtracts a monthly bill cost', () => {
    const bills = [makeBill({ amountPence: 50000 })]
    const result = calculateDisposableIncome(250000, [], bills, 2026, 1)
    expect(result).toBe(200000)
  })

  it('handles both pots and bills together', () => {
    const pots = [makePot(100000)]
    const bills = [makeBill({ amountPence: 50000 })]
    const result = calculateDisposableIncome(250000, pots, bills, 2026, 1)
    expect(result).toBe(100000)
  })

  it('avoids float accumulation errors with values that cause float drift', () => {
    // Create 10 pots of 33333 pence each = 333330 pence total
    // Income 333340 => disposable should be 10 (not 9.9999... due to float errors)
    const pots = Array.from({ length: 10 }, (_, i) => makePot(33333, { id: i + 1 }))
    const result = calculateDisposableIncome(333340, pots, [], 2026, 1)
    expect(result).toBe(10)
  })
})
