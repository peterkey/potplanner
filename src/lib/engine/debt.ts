import Decimal from 'decimal.js'

export interface DebtInput {
  id: number
  name: string
  balancePence: number
  interestRate: number // basis points (2500 = 25.00%)
  minimumPaymentPence: number
}

export interface DebtPayoffMonth {
  month: number // 1-indexed from start
  debtId: number
  debtName: string
  paymentPence: number
  interestPence: number
  principalPence: number
  remainingBalancePence: number
}

export interface DebtPayoffPlan {
  strategy: 'avalanche' | 'snowball'
  payoffOrder: string[]
  timeline: DebtPayoffMonth[]
  totalMonths: number
  totalInterestPence: number
}

const MAX_MONTHS = 600 // 50-year safety cap

export function calculateAvalanche(debts: DebtInput[], monthlyExtraPence = 0): DebtPayoffPlan {
  const sorted = [...debts].sort((a, b) => b.interestRate - a.interestRate)
  return runSimulation(sorted, monthlyExtraPence, 'avalanche')
}

export function calculateSnowball(debts: DebtInput[], monthlyExtraPence = 0): DebtPayoffPlan {
  const sorted = [...debts].sort((a, b) => a.balancePence - b.balancePence)
  return runSimulation(sorted, monthlyExtraPence, 'snowball')
}

function runSimulation(
  orderedDebts: DebtInput[],
  monthlyExtraPence: number,
  strategy: 'avalanche' | 'snowball'
): DebtPayoffPlan {
  if (orderedDebts.length === 0) {
    return { strategy, payoffOrder: [], timeline: [], totalMonths: 0, totalInterestPence: 0 }
  }

  const balances = new Map<number, Decimal>(
    orderedDebts.map((d) => [d.id, new Decimal(d.balancePence)])
  )
  const timeline: DebtPayoffMonth[] = []
  const payoffOrder: string[] = []
  let totalInterestPence = new Decimal(0)
  let month = 0
  let freedPayment = new Decimal(0)

  while (month < MAX_MONTHS) {
    const active = orderedDebts.filter((d) => (balances.get(d.id) ?? new Decimal(0)).gt(0))
    if (active.length === 0) break
    month++

    // Extra pence goes to the first active debt (priority target)
    const priorityId = active[0].id
    let extraAvailable = new Decimal(monthlyExtraPence).plus(freedPayment)

    for (const debt of active) {
      const bal = balances.get(debt.id)!
      const monthlyRate = new Decimal(debt.interestRate).div(10000).div(12)
      const interest = bal.times(monthlyRate).toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
      totalInterestPence = totalInterestPence.plus(interest)

      let payment = new Decimal(debt.minimumPaymentPence)
      if (debt.id === priorityId) {
        payment = payment.plus(extraAvailable)
      }

      const maxPayment = bal.plus(interest)
      if (payment.gt(maxPayment)) payment = maxPayment

      const principal = payment.minus(interest).toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
      const newBalance = bal.minus(principal).toDecimalPlaces(0, Decimal.ROUND_HALF_UP)

      timeline.push({
        month,
        debtId: debt.id,
        debtName: debt.name,
        paymentPence: payment.toNumber(),
        interestPence: interest.toNumber(),
        principalPence: principal.toNumber(),
        remainingBalancePence: Math.max(0, newBalance.toNumber()),
      })

      if (newBalance.lte(0)) {
        balances.set(debt.id, new Decimal(0))
        if (!payoffOrder.includes(debt.name)) {
          payoffOrder.push(debt.name)
          freedPayment = freedPayment.plus(debt.minimumPaymentPence)
        }
      } else {
        balances.set(debt.id, newBalance)
      }
    }
  }

  return {
    strategy,
    payoffOrder,
    timeline,
    totalMonths: month,
    totalInterestPence: totalInterestPence.toNumber(),
  }
}
