import { describe, it, expect } from 'vitest'
import { forecastMonths } from './forecast'
import type { Bill, ForecastInput, ForecastMonth, Pot } from './types'

// Test helpers
function makePot(overrides?: Partial<Pot>): Pot {
  return { id: 1, name: 'Test Pot', allocatedPence: 0, rollover: false, ...overrides }
}

function makeBill(overrides?: Partial<Bill>): Bill {
  return {
    id: 1,
    name: 'Test Bill',
    amountPence: 10000,
    frequency: 'monthly',
    potId: null,
    nextDueDate: new Date(2026, 0, 15),
    ...overrides,
  }
}

function makeInput(overrides?: Partial<ForecastInput>): ForecastInput {
  return {
    monthlyIncomePence: 250000,
    pots: [],
    bills: [],
    startingBalancePence: 0,
    startYear: 2026,
    startMonth: 1,
    ...overrides,
  }
}

describe('forecastMonths - basic', () => {
  it('n=1 with no pots and no bills: returns array of length 1', () => {
    const result = forecastMonths(makeInput(), 1)
    expect(result).toHaveLength(1)
  })

  it('n=1: single month has correct year and month', () => {
    const result = forecastMonths(makeInput({ startYear: 2026, startMonth: 1 }), 1)
    expect(result[0].year).toBe(2026)
    expect(result[0].month).toBe(1)
  })

  it('n=1 no pots/bills: all fields are correct', () => {
    const result = forecastMonths(makeInput({ monthlyIncomePence: 250000 }), 1)
    const month = result[0]
    expect(month.incomePence).toBe(250000)
    expect(month.totalBillsPence).toBe(0)
    expect(month.potAllocationsPence).toBe(0)
    expect(month.disposableIncomePence).toBe(250000)
    expect(month.cumulativeBalancePence).toBe(250000)
    expect(month.billsDue).toEqual([])
  })

  it('n=3 with no pots/bills: returns array of length 3', () => {
    const result = forecastMonths(makeInput(), 3)
    expect(result).toHaveLength(3)
  })

  it('n=3 no pots/bills: months are Jan, Feb, Mar 2026', () => {
    const result = forecastMonths(makeInput({ startYear: 2026, startMonth: 1 }), 3)
    expect(result[0]).toMatchObject({ year: 2026, month: 1 })
    expect(result[1]).toMatchObject({ year: 2026, month: 2 })
    expect(result[2]).toMatchObject({ year: 2026, month: 3 })
  })
})

describe('forecastMonths - with pots', () => {
  it('income 250000, pot allocation 100000, no bills, 3 months: each month disposable is 150000', () => {
    const input = makeInput({
      monthlyIncomePence: 250000,
      pots: [makePot({ allocatedPence: 100000 })],
    })
    const result = forecastMonths(input, 3)
    expect(result[0].disposableIncomePence).toBe(150000)
    expect(result[1].disposableIncomePence).toBe(150000)
    expect(result[2].disposableIncomePence).toBe(150000)
  })

  it('income 250000, pot allocation 100000, no bills, 3 months: cumulative grows by 150000 each month', () => {
    const input = makeInput({
      monthlyIncomePence: 250000,
      pots: [makePot({ allocatedPence: 100000 })],
    })
    const result = forecastMonths(input, 3)
    expect(result[0].cumulativeBalancePence).toBe(150000)
    expect(result[1].cumulativeBalancePence).toBe(300000)
    expect(result[2].cumulativeBalancePence).toBe(450000)
  })

  it('pot allocations are reflected in potAllocationsPence field', () => {
    const input = makeInput({
      pots: [makePot({ id: 1, allocatedPence: 60000 }), makePot({ id: 2, allocatedPence: 40000 })],
    })
    const result = forecastMonths(input, 1)
    expect(result[0].potAllocationsPence).toBe(100000)
  })
})

describe('forecastMonths - with bills', () => {
  it('income 250000, monthly bill 50000 on 15th, no pots, 3 months: each month totalBillsPence is 50000', () => {
    const input = makeInput({
      monthlyIncomePence: 250000,
      bills: [makeBill({ amountPence: 50000, frequency: 'monthly', nextDueDate: new Date(2026, 0, 15) })],
    })
    const result = forecastMonths(input, 3)
    expect(result[0].totalBillsPence).toBe(50000)
    expect(result[1].totalBillsPence).toBe(50000)
    expect(result[2].totalBillsPence).toBe(50000)
  })

  it('income 250000, monthly bill 50000, no pots, 3 months: each month disposable is 200000', () => {
    const input = makeInput({
      monthlyIncomePence: 250000,
      bills: [makeBill({ amountPence: 50000, frequency: 'monthly', nextDueDate: new Date(2026, 0, 15) })],
    })
    const result = forecastMonths(input, 3)
    expect(result[0].disposableIncomePence).toBe(200000)
    expect(result[1].disposableIncomePence).toBe(200000)
    expect(result[2].disposableIncomePence).toBe(200000)
  })

  it('weekly bill from Jan 1 2026: Jan has 5 occurrences (5 Thursdays: 1, 8, 15, 22, 29)', () => {
    // Jan 1 2026 is a Thursday — 5 Thursdays in Jan
    const input = makeInput({
      startYear: 2026,
      startMonth: 1,
      bills: [makeBill({ frequency: 'weekly', amountPence: 10000, nextDueDate: new Date(2026, 0, 1) })],
    })
    const result = forecastMonths(input, 1)
    expect(result[0].totalBillsPence).toBe(50000) // 5 * 10000
  })

  it('weekly bill from Jan 1 2026: Feb has 4 occurrences', () => {
    const input = makeInput({
      startYear: 2026,
      startMonth: 2,
      bills: [makeBill({ frequency: 'weekly', amountPence: 10000, nextDueDate: new Date(2026, 0, 1) })],
    })
    const result = forecastMonths(input, 1)
    expect(result[0].totalBillsPence).toBe(40000) // 4 * 10000
  })
})

describe('forecastMonths - cumulative balance', () => {
  it('startingBalance 100000, income 200000, no pots/bills, 3 months: cumulative = [300000, 500000, 700000]', () => {
    const input = makeInput({ startingBalancePence: 100000, monthlyIncomePence: 200000 })
    const result = forecastMonths(input, 3)
    expect(result[0].cumulativeBalancePence).toBe(300000)
    expect(result[1].cumulativeBalancePence).toBe(500000)
    expect(result[2].cumulativeBalancePence).toBe(700000)
  })

  it('startingBalance 0, income 100000, pots 80000, monthly bill 50000, 2 months: disposable -30000, cumulative = [-30000, -60000]', () => {
    const input = makeInput({
      startingBalancePence: 0,
      monthlyIncomePence: 100000,
      pots: [makePot({ allocatedPence: 80000 })],
      bills: [makeBill({ amountPence: 50000, frequency: 'monthly', nextDueDate: new Date(2026, 0, 15) })],
    })
    const result = forecastMonths(input, 2)
    expect(result[0].disposableIncomePence).toBe(-30000)
    expect(result[0].cumulativeBalancePence).toBe(-30000)
    expect(result[1].disposableIncomePence).toBe(-30000)
    expect(result[1].cumulativeBalancePence).toBe(-60000)
  })

  it('zero income, no pots, no bills: cumulative stays at startingBalance each month', () => {
    const input = makeInput({ startingBalancePence: 50000, monthlyIncomePence: 0 })
    const result = forecastMonths(input, 2)
    expect(result[0].cumulativeBalancePence).toBe(50000)
    expect(result[1].cumulativeBalancePence).toBe(50000)
  })
})

describe('forecastMonths - billsDue field', () => {
  it('month with no bill occurrences: billsDue is empty array', () => {
    const input = makeInput({
      startYear: 2026,
      startMonth: 1,
      bills: [makeBill({ frequency: 'annual', nextDueDate: new Date(2026, 6, 1) })], // July bill
    })
    const result = forecastMonths(input, 1) // Jan only
    expect(result[0].billsDue).toEqual([])
  })

  it('BillOccurrence objects have correct billId, name, amountPence, dueDate, potId', () => {
    const bill = makeBill({
      id: 42,
      name: 'Rent',
      amountPence: 80000,
      frequency: 'monthly',
      nextDueDate: new Date(2026, 0, 1),
      potId: 7,
    })
    const input = makeInput({ bills: [bill] })
    const result = forecastMonths(input, 1)
    expect(result[0].billsDue).toHaveLength(1)
    expect(result[0].billsDue[0]).toMatchObject({
      billId: 42,
      name: 'Rent',
      amountPence: 80000,
      potId: 7,
    })
    expect(result[0].billsDue[0].dueDate).toBeInstanceOf(Date)
  })

  it('multiple bill occurrences in same month: billsDue contains all of them', () => {
    // Weekly bill: 5 occurrences in Jan 2026
    const bill = makeBill({ frequency: 'weekly', nextDueDate: new Date(2026, 0, 1) })
    const input = makeInput({ bills: [bill] })
    const result = forecastMonths(input, 1)
    expect(result[0].billsDue).toHaveLength(5)
  })
})

describe('forecastMonths - year rollover', () => {
  it('startMonth=11, n=4: months are Nov 2026, Dec 2026, Jan 2027, Feb 2027', () => {
    const input = makeInput({ startYear: 2026, startMonth: 11 })
    const result = forecastMonths(input, 4)
    expect(result[0]).toMatchObject({ year: 2026, month: 11 })
    expect(result[1]).toMatchObject({ year: 2026, month: 12 })
    expect(result[2]).toMatchObject({ year: 2027, month: 1 })
    expect(result[3]).toMatchObject({ year: 2027, month: 2 })
  })

  it('startMonth=12, n=2: Dec 2026 then Jan 2027', () => {
    const input = makeInput({ startYear: 2026, startMonth: 12 })
    const result = forecastMonths(input, 2)
    expect(result[0]).toMatchObject({ year: 2026, month: 12 })
    expect(result[1]).toMatchObject({ year: 2027, month: 1 })
  })
})

describe('forecastMonths - boundary values', () => {
  it('n=1: returns exactly 1 month', () => {
    const result = forecastMonths(makeInput(), 1)
    expect(result).toHaveLength(1)
  })

  it('n=12: returns exactly 12 months', () => {
    const result = forecastMonths(makeInput({ startYear: 2026, startMonth: 1 }), 12)
    expect(result).toHaveLength(12)
  })

  it('n=12 starting Jan: last month is Dec of same year', () => {
    const result = forecastMonths(makeInput({ startYear: 2026, startMonth: 1 }), 12)
    expect(result[11]).toMatchObject({ year: 2026, month: 12 })
  })
})

describe('forecastMonths - mixed frequencies', () => {
  it('annual bill (Jul) only appears in July month, not in others', () => {
    const annualBill = makeBill({
      id: 1,
      frequency: 'annual',
      amountPence: 120000,
      nextDueDate: new Date(2026, 6, 1), // Jul 1
    })
    const input = makeInput({
      startYear: 2026,
      startMonth: 6,
      bills: [annualBill],
    })
    const result = forecastMonths(input, 3) // Jun, Jul, Aug
    expect(result[0].totalBillsPence).toBe(0) // Jun: no annual bill
    expect(result[1].totalBillsPence).toBe(120000) // Jul: annual bill hits
    expect(result[2].totalBillsPence).toBe(0) // Aug: no annual bill
  })

  it('multiple bills with different frequencies: totalBillsPence sums all occurrences', () => {
    const monthlyBill = makeBill({ id: 1, frequency: 'monthly', amountPence: 50000, nextDueDate: new Date(2026, 0, 15) })
    const weeklyBill = makeBill({ id: 2, frequency: 'weekly', amountPence: 10000, nextDueDate: new Date(2026, 0, 1) })
    const input = makeInput({ bills: [monthlyBill, weeklyBill] })
    const result = forecastMonths(input, 1) // Jan 2026: monthly(50000) + weekly*5(50000) = 100000
    expect(result[0].totalBillsPence).toBe(100000)
  })

  it('zero income household with bills: cumulative goes increasingly negative', () => {
    const input = makeInput({
      monthlyIncomePence: 0,
      startingBalancePence: 0,
      bills: [makeBill({ amountPence: 50000, frequency: 'monthly', nextDueDate: new Date(2026, 0, 15) })],
    })
    const result = forecastMonths(input, 3)
    expect(result[0].cumulativeBalancePence).toBe(-50000)
    expect(result[1].cumulativeBalancePence).toBe(-100000)
    expect(result[2].cumulativeBalancePence).toBe(-150000)
  })
})
