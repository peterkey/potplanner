import { differenceInMonths } from 'date-fns'
import type { PayFrequency } from './types'

export function getPeriodsUntilDate(goalDate: Date, frequency: PayFrequency): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (goalDate <= today) return 1

  const msRemaining = goalDate.getTime() - today.getTime()
  const daysRemaining = msRemaining / (1000 * 60 * 60 * 24)

  switch (frequency) {
    case 'weekly':      return Math.max(1, Math.floor(daysRemaining / 7))
    case 'biweekly':    return Math.max(1, Math.floor(daysRemaining / 14))
    case 'four_weekly': return Math.max(1, Math.floor(daysRemaining / 28))
    case 'monthly':     return Math.max(1, differenceInMonths(goalDate, today))
  }
}

// Returns the pence this member needs to contribute each pay period to reach their share by goalDate.
export function getSavingsContributionPerPeriod(
  targetPence: number,
  savedPence: number,
  memberPercentage: number,
  periodsRemaining: number,
): number {
  const memberTarget = Math.ceil(targetPence * memberPercentage / 100)
  // savedPence is the total saved so far; attribute member's share proportionally
  const memberSaved = Math.floor(savedPence * memberPercentage / 100)
  const remaining = memberTarget - memberSaved
  if (remaining <= 0) return 0
  return Math.ceil(remaining / periodsRemaining)
}
