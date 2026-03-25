import type { Bill } from './types'

// Stub implementation — real bill scheduling implemented in Plan 02
export function getMonthlyBillCost(bill: Bill, _year: number, _month: number): number {
  // Stub: returns amountPence for monthly bills (sufficient for income tests in Plan 01)
  return bill.amountPence
}

export function getBillOccurrences(_bill: Bill, _startDate: Date, _endDate: Date): Date[] {
  return [] // Stub — real implementation in Plan 02
}
