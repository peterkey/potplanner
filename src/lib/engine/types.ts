export type BillFrequency = 'weekly' | 'biweekly' | 'four_weekly' | 'monthly' | 'annual'

export interface Pot {
  id: number
  name: string
  allocatedPence: number
  rollover: boolean
}

export interface Bill {
  id: number
  name: string
  amountPence: number
  frequency: BillFrequency
  potId: number | null
  nextDueDate: Date
}

export interface BillOccurrence {
  billId: number
  name: string
  amountPence: number
  dueDate: Date
  potId: number | null
}

export interface ForecastInput {
  monthlyIncomePence: number
  pots: Pot[]
  bills: Bill[]
  startingBalancePence: number
  startYear: number
  startMonth: number // 1-12
}

export interface ForecastMonth {
  year: number
  month: number // 1-12
  incomePence: number
  billsDue: BillOccurrence[]
  totalBillsPence: number
  potAllocationsPence: number
  disposableIncomePence: number
  cumulativeBalancePence: number
}

export interface IncomeValidation {
  valid: boolean
  value?: number
  error?: string
}
