import Decimal from 'decimal.js'
import { endOfMonth } from 'date-fns'
import type { ForecastInput, ForecastMonth, BillOccurrence, Pot, Bill, PayFrequency, PayPeriodForecast } from './types'
import { getBillOccurrences } from './bills'
import { getWindowEnd } from './paycheck'

const PERIODS_PER_YEAR: Record<PayFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  four_weekly: 13,
  monthly: 12,
}

/**
 * Projects cash flow for N pay periods starting from firstPeriodStart.
 *
 * Each period covers [periodStart, periodEnd) where periodEnd is the exclusive
 * start of the next period. Bill queries use periodEnd - 1ms so boundary dates
 * fall in exactly one window.
 *
 * Pot allocations are prorated: monthlyTotal × 12 / periodsPerYear.
 */
export function forecastPayPeriods(
  firstPeriodStart: Date,
  frequency: PayFrequency,
  incomePerPeriodPence: number,
  pots: Pot[],
  bills: Bill[],
  n: number,
  startingBalancePence = 0,
): PayPeriodForecast[] {
  const results: PayPeriodForecast[] = []
  let cumulativeBalance = new Decimal(startingBalancePence)
  let periodStart = new Date(firstPeriodStart)

  const periodsPerYear = PERIODS_PER_YEAR[frequency]
  const totalMonthlyPotsPence = pots.reduce((acc, p) => acc + p.allocatedPence, 0)
  const potAllocationsPence = Math.round((totalMonthlyPotsPence * 12) / periodsPerYear)

  for (let i = 0; i < n; i++) {
    const nextStart = getWindowEnd(periodStart, frequency)
    // Use 1ms before next period start as inclusive endDate to avoid double-counting boundary dates
    const inclusiveEnd = new Date(nextStart.getTime() - 1)

    const billsDue: BillOccurrence[] = []
    let totalBillsPence = new Decimal(0)

    for (const bill of bills) {
      const occurrenceDates = getBillOccurrences(bill, periodStart, inclusiveEnd)
      for (const dueDate of occurrenceDates) {
        billsDue.push({ billId: bill.id, name: bill.name, amountPence: bill.amountPence, dueDate, potId: bill.potId })
        totalBillsPence = totalBillsPence.plus(bill.amountPence)
      }
    }

    const disposableIncomePence = new Decimal(incomePerPeriodPence)
      .minus(potAllocationsPence)
      .minus(totalBillsPence)

    cumulativeBalance = cumulativeBalance.plus(disposableIncomePence)

    results.push({
      periodStart: new Date(periodStart),
      periodEnd: new Date(nextStart),
      incomePence: incomePerPeriodPence,
      billsDue,
      totalBillsPence: totalBillsPence.toNumber(),
      potAllocationsPence,
      disposableIncomePence: disposableIncomePence.toNumber(),
      cumulativeBalancePence: cumulativeBalance.toNumber(),
    })

    periodStart = nextStart
  }

  return results
}

/**
 * Projects cash flow for N months starting from the given month in ForecastInput.
 *
 * For each month:
 * - Collects all bill occurrences using getBillOccurrences (actual counts, not annualised)
 * - Computes disposableIncomePence = income - potAllocations - totalBills
 * - Tracks cumulativeBalancePence as a running total from startingBalancePence
 *
 * All arithmetic uses Decimal to prevent float accumulation errors.
 * Result can include negative disposable income (over-allocated) — never clamped.
 */
export function forecastMonths(input: ForecastInput, n: number): ForecastMonth[] {
  const results: ForecastMonth[] = []
  let cumulativeBalance = new Decimal(input.startingBalancePence)
  let currentYear = input.startYear
  let currentMonth = input.startMonth

  for (let i = 0; i < n; i++) {
    const monthStart = new Date(currentYear, currentMonth - 1, 1)
    const monthEnd = endOfMonth(monthStart) // 23:59:59.999 — correct for <= comparison

    // Collect bill occurrences for this month
    const billsDue: BillOccurrence[] = []
    let totalBillsPence = new Decimal(0)

    for (const bill of input.bills) {
      const occurrenceDates = getBillOccurrences(bill, monthStart, monthEnd)
      for (const dueDate of occurrenceDates) {
        billsDue.push({
          billId: bill.id,
          name: bill.name,
          amountPence: bill.amountPence,
          dueDate,
          potId: bill.potId,
        })
        totalBillsPence = totalBillsPence.plus(bill.amountPence)
      }
    }

    // Sum pot allocations
    const potAllocationsPence = input.pots.reduce(
      (acc, p) => acc.plus(p.allocatedPence),
      new Decimal(0)
    )

    // Disposable income = income - pot allocations - bills
    const disposableIncomePence = new Decimal(input.monthlyIncomePence)
      .minus(potAllocationsPence)
      .minus(totalBillsPence)

    // Accumulate cumulative balance
    cumulativeBalance = cumulativeBalance.plus(disposableIncomePence)

    results.push({
      year: currentYear,
      month: currentMonth,
      incomePence: input.monthlyIncomePence,
      billsDue,
      totalBillsPence: totalBillsPence.toNumber(),
      potAllocationsPence: potAllocationsPence.toNumber(),
      disposableIncomePence: disposableIncomePence.toNumber(),
      cumulativeBalancePence: cumulativeBalance.toNumber(),
    })

    // Advance to next month (with year rollover)
    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
  }

  return results
}
