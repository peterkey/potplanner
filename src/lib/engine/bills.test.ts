import { describe, it, expect } from 'vitest'
import { advanceByFrequency, getBillOccurrences, getMonthlyBillCost } from './bills'
import type { Bill } from './types'

function makeBill(overrides?: Partial<Bill>): Bill {
  return {
    id: 1,
    name: 'Test Bill',
    amountPence: 10000,
    frequency: 'monthly',
    potId: null,
    nextDueDate: new Date(2026, 0, 1), // Jan 1 2026
    ...overrides,
  }
}

describe('advanceByFrequency', () => {
  const jan1 = new Date(2026, 0, 1)

  it('weekly: Jan 1 -> Jan 8', () => {
    const result = advanceByFrequency(jan1, 'weekly')
    expect(result).toEqual(new Date(2026, 0, 8))
  })

  it('biweekly: Jan 1 -> Jan 15', () => {
    const result = advanceByFrequency(jan1, 'biweekly')
    expect(result).toEqual(new Date(2026, 0, 15))
  })

  it('four_weekly: Jan 1 -> Jan 29', () => {
    const result = advanceByFrequency(jan1, 'four_weekly')
    expect(result).toEqual(new Date(2026, 0, 29))
  })

  it('monthly: Jan 31 -> Feb 28 (non-leap 2026)', () => {
    const jan31 = new Date(2026, 0, 31)
    const result = advanceByFrequency(jan31, 'monthly')
    expect(result).toEqual(new Date(2026, 1, 28))
  })

  it('annual: Jan 1 2026 -> Jan 1 2027', () => {
    const result = advanceByFrequency(jan1, 'annual')
    expect(result).toEqual(new Date(2027, 0, 1))
  })
})

describe('getBillOccurrences - weekly', () => {
  it('5-occurrence month: Jan 2026 returns 5 Thursdays (Jan 1, 8, 15, 22, 29)', () => {
    const bill = makeBill({ frequency: 'weekly', nextDueDate: new Date(2026, 0, 1) })
    const start = new Date(2026, 0, 1)
    const end = new Date(2026, 0, 31)
    const result = getBillOccurrences(bill, start, end)
    expect(result).toHaveLength(5)
    expect(result[0]).toEqual(new Date(2026, 0, 1))
    expect(result[1]).toEqual(new Date(2026, 0, 8))
    expect(result[2]).toEqual(new Date(2026, 0, 15))
    expect(result[3]).toEqual(new Date(2026, 0, 22))
    expect(result[4]).toEqual(new Date(2026, 0, 29))
  })

  it('4-occurrence month: Feb 2026 returns 4 dates (Feb 5, 12, 19, 26)', () => {
    const bill = makeBill({ frequency: 'weekly', nextDueDate: new Date(2026, 0, 1) })
    const start = new Date(2026, 1, 1)
    const end = new Date(2026, 1, 28)
    const result = getBillOccurrences(bill, start, end)
    expect(result).toHaveLength(4)
    expect(result[0]).toEqual(new Date(2026, 1, 5))
    expect(result[1]).toEqual(new Date(2026, 1, 12))
    expect(result[2]).toEqual(new Date(2026, 1, 19))
    expect(result[3]).toEqual(new Date(2026, 1, 26))
  })

  it('bill starting before range: skips dates before start, includes dates in range', () => {
    // Bill starts Dec 25 2025 (before range), range is Jan 1-31 2026
    const bill = makeBill({ frequency: 'weekly', nextDueDate: new Date(2025, 11, 25) })
    const start = new Date(2026, 0, 1)
    const end = new Date(2026, 0, 31)
    const result = getBillOccurrences(bill, start, end)
    // Dec 25, Jan 1, Jan 8, Jan 15, Jan 22, Jan 29
    expect(result).toHaveLength(5)
    expect(result[0]).toEqual(new Date(2026, 0, 1))
  })
})

describe('getBillOccurrences - biweekly', () => {
  it('Jan 2026 biweekly from Jan 1: returns Jan 1, Jan 15, Jan 29 (3 dates)', () => {
    const bill = makeBill({ frequency: 'biweekly', nextDueDate: new Date(2026, 0, 1) })
    const start = new Date(2026, 0, 1)
    const end = new Date(2026, 0, 31)
    const result = getBillOccurrences(bill, start, end)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual(new Date(2026, 0, 1))
    expect(result[1]).toEqual(new Date(2026, 0, 15))
    expect(result[2]).toEqual(new Date(2026, 0, 29))
  })

  it('Jan 1 - Feb 28 2026 biweekly: returns correct dates across 2 months', () => {
    const bill = makeBill({ frequency: 'biweekly', nextDueDate: new Date(2026, 0, 1) })
    const start = new Date(2026, 0, 1)
    const end = new Date(2026, 1, 28)
    const result = getBillOccurrences(bill, start, end)
    // Jan 1, Jan 15, Jan 29, Feb 12, Feb 26
    expect(result).toHaveLength(5)
    expect(result[0]).toEqual(new Date(2026, 0, 1))
    expect(result[4]).toEqual(new Date(2026, 1, 26))
  })
})

describe('getBillOccurrences - four_weekly', () => {
  it('Jan 2026 four_weekly from Jan 1: returns Jan 1, Jan 29 (2 dates)', () => {
    const bill = makeBill({ frequency: 'four_weekly', nextDueDate: new Date(2026, 0, 1) })
    const start = new Date(2026, 0, 1)
    const end = new Date(2026, 0, 31)
    const result = getBillOccurrences(bill, start, end)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(new Date(2026, 0, 1))
    expect(result[1]).toEqual(new Date(2026, 0, 29))
  })

  it('Feb 2026 four_weekly from Jan 1: returns Feb 26 only (1 date)', () => {
    const bill = makeBill({ frequency: 'four_weekly', nextDueDate: new Date(2026, 0, 1) })
    const start = new Date(2026, 1, 1)
    const end = new Date(2026, 1, 28)
    const result = getBillOccurrences(bill, start, end)
    // Jan 1, Jan 29, Feb 26 -- so Feb has 1 occurrence
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(new Date(2026, 1, 26))
  })
})

describe('getBillOccurrences - monthly', () => {
  it('monthly bill due 15th: returns Jan 15, Feb 15, Mar 15', () => {
    const bill = makeBill({ frequency: 'monthly', nextDueDate: new Date(2026, 0, 15) })
    const start = new Date(2026, 0, 1)
    const end = new Date(2026, 2, 31)
    const result = getBillOccurrences(bill, start, end)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual(new Date(2026, 0, 15))
    expect(result[1]).toEqual(new Date(2026, 1, 15))
    expect(result[2]).toEqual(new Date(2026, 2, 15))
  })

  it('monthly bill on 31st over 6 months: Jan 31, Feb 28, Mar 31, Apr 30, May 31, Jun 30 (NO date drift)', () => {
    const bill = makeBill({ frequency: 'monthly', nextDueDate: new Date(2026, 0, 31) })
    const start = new Date(2026, 0, 1)
    const end = new Date(2026, 5, 30)
    const result = getBillOccurrences(bill, start, end)
    expect(result).toHaveLength(6)
    expect(result[0]).toEqual(new Date(2026, 0, 31)) // Jan 31
    expect(result[1]).toEqual(new Date(2026, 1, 28)) // Feb 28 (clamped)
    expect(result[2]).toEqual(new Date(2026, 2, 31)) // Mar 31 -- CRITICAL: not 28
    expect(result[3]).toEqual(new Date(2026, 3, 30)) // Apr 30 (clamped)
    expect(result[4]).toEqual(new Date(2026, 4, 31)) // May 31
    expect(result[5]).toEqual(new Date(2026, 5, 30)) // Jun 30 (clamped)
  })

  it('monthly bill on 29th in non-leap Feb 2026: returns Jan 29, Feb 28', () => {
    const bill = makeBill({ frequency: 'monthly', nextDueDate: new Date(2026, 0, 29) })
    const start = new Date(2026, 0, 1)
    const end = new Date(2026, 1, 28)
    const result = getBillOccurrences(bill, start, end)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(new Date(2026, 0, 29))
    expect(result[1]).toEqual(new Date(2026, 1, 28)) // Feb 28 (clamped from 29)
  })

  it('monthly bill starting mid-range: skips occurrences before startDate', () => {
    const bill = makeBill({ frequency: 'monthly', nextDueDate: new Date(2026, 0, 15) })
    const start = new Date(2026, 1, 1) // Start in February
    const end = new Date(2026, 2, 31)
    const result = getBillOccurrences(bill, start, end)
    // Jan 15 is skipped (before start), Feb 15 and Mar 15 are included
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(new Date(2026, 1, 15))
    expect(result[1]).toEqual(new Date(2026, 2, 15))
  })
})

describe('getBillOccurrences - annual', () => {
  it('annual bill due Mar 15: range Jan-Dec 2026 returns 1 occurrence', () => {
    const bill = makeBill({ frequency: 'annual', nextDueDate: new Date(2026, 2, 15) })
    const start = new Date(2026, 0, 1)
    const end = new Date(2026, 11, 31)
    const result = getBillOccurrences(bill, start, end)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(new Date(2026, 2, 15))
  })

  it('annual bill due Mar 15: range Jan 2026 - Dec 2027 returns 2 occurrences', () => {
    const bill = makeBill({ frequency: 'annual', nextDueDate: new Date(2026, 2, 15) })
    const start = new Date(2026, 0, 1)
    const end = new Date(2027, 11, 31)
    const result = getBillOccurrences(bill, start, end)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(new Date(2026, 2, 15))
    expect(result[1]).toEqual(new Date(2027, 2, 15))
  })

  it('annual bill due Feb 29 (2024 leap): non-leap years clamp to Feb 28', () => {
    // 2024 is a leap year; 2025 and 2027 are not; 2026 is not either
    const bill = makeBill({ frequency: 'annual', nextDueDate: new Date(2024, 1, 29) })
    const start = new Date(2025, 0, 1)
    const end = new Date(2027, 11, 31)
    const result = getBillOccurrences(bill, start, end)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual(new Date(2025, 1, 28)) // 2025: non-leap, Feb 28
    expect(result[1]).toEqual(new Date(2026, 1, 28)) // 2026: non-leap, Feb 28
    expect(result[2]).toEqual(new Date(2027, 1, 28)) // 2027: non-leap, Feb 28
  })

  it('annual bill due Jul 1: range Jan-Jun 2026 returns 0 occurrences', () => {
    const bill = makeBill({ frequency: 'annual', nextDueDate: new Date(2026, 6, 1) })
    const start = new Date(2026, 0, 1)
    const end = new Date(2026, 5, 30)
    const result = getBillOccurrences(bill, start, end)
    expect(result).toHaveLength(0)
  })
})

describe('getBillOccurrences - edge cases', () => {
  it('bill with nextDueDate after endDate: returns empty array', () => {
    const bill = makeBill({ frequency: 'monthly', nextDueDate: new Date(2027, 0, 1) })
    const start = new Date(2026, 0, 1)
    const end = new Date(2026, 11, 31)
    const result = getBillOccurrences(bill, start, end)
    expect(result).toHaveLength(0)
  })

  it('bill with nextDueDate exactly on startDate: includes it', () => {
    const bill = makeBill({ frequency: 'monthly', nextDueDate: new Date(2026, 0, 1) })
    const start = new Date(2026, 0, 1)
    const end = new Date(2026, 0, 31)
    const result = getBillOccurrences(bill, start, end)
    expect(result[0]).toEqual(new Date(2026, 0, 1))
  })

  it('bill with nextDueDate exactly on endDate: includes it', () => {
    const bill = makeBill({ frequency: 'monthly', nextDueDate: new Date(2026, 0, 31) })
    const start = new Date(2026, 0, 1)
    const end = new Date(2026, 0, 31)
    const result = getBillOccurrences(bill, start, end)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(new Date(2026, 0, 31))
  })
})

describe('getMonthlyBillCost', () => {
  it('monthly bill £100: returns 10000 pence for any month', () => {
    const bill = makeBill({ frequency: 'monthly', nextDueDate: new Date(2026, 0, 15), amountPence: 10000 })
    expect(getMonthlyBillCost(bill, 2026, 1)).toBe(10000)
    expect(getMonthlyBillCost(bill, 2026, 2)).toBe(10000)
    expect(getMonthlyBillCost(bill, 2026, 3)).toBe(10000)
  })

  it('weekly bill £50: returns 5 occurrences in Jan 2026 (5-occurrence month)', () => {
    const bill = makeBill({ frequency: 'weekly', nextDueDate: new Date(2026, 0, 1), amountPence: 5000 })
    const cost = getMonthlyBillCost(bill, 2026, 1)
    expect(cost).toBe(25000) // 5 * 5000
  })

  it('weekly bill £50: returns 4 occurrences in Feb 2026 (4-occurrence month)', () => {
    const bill = makeBill({ frequency: 'weekly', nextDueDate: new Date(2026, 0, 1), amountPence: 5000 })
    const cost = getMonthlyBillCost(bill, 2026, 2)
    expect(cost).toBe(20000) // 4 * 5000
  })

  it('annual bill due Jul 1: returns 0 for non-July months', () => {
    const bill = makeBill({ frequency: 'annual', nextDueDate: new Date(2026, 6, 1), amountPence: 120000 })
    expect(getMonthlyBillCost(bill, 2026, 1)).toBe(0)
    expect(getMonthlyBillCost(bill, 2026, 6)).toBe(0)
    expect(getMonthlyBillCost(bill, 2026, 8)).toBe(0)
  })

  it('annual bill due Jul 1: returns full amount for July only', () => {
    const bill = makeBill({ frequency: 'annual', nextDueDate: new Date(2026, 6, 1), amountPence: 120000 })
    expect(getMonthlyBillCost(bill, 2026, 7)).toBe(120000)
  })

  it('monthly bill on 31st: includes last day of month correctly (no off-by-one)', () => {
    const bill = makeBill({ frequency: 'monthly', nextDueDate: new Date(2026, 0, 31), amountPence: 5000 })
    // Jan has 31st, so it should be charged
    expect(getMonthlyBillCost(bill, 2026, 1)).toBe(5000)
    // Feb: 31st clamps to 28th — still counts as 1 occurrence
    expect(getMonthlyBillCost(bill, 2026, 2)).toBe(5000)
    // Mar has 31st, so it should be charged
    expect(getMonthlyBillCost(bill, 2026, 3)).toBe(5000)
  })
})
