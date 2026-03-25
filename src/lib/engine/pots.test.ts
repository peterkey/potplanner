import { describe, it, expect } from 'vitest'
import { sumPotAllocations, validatePotAllocations, getPotBalance } from '@/lib/engine/pots'
import type { Pot } from '@/lib/engine/types'

function makePot(allocatedPence: number, id = 1): Pot {
  return {
    id,
    name: `Pot ${id}`,
    allocatedPence,
    rollover: false,
  }
}

describe('sumPotAllocations', () => {
  it('returns 0 for an empty pots array', () => {
    expect(sumPotAllocations([])).toBe(0)
  })

  it('returns the allocation amount for a single pot', () => {
    expect(sumPotAllocations([makePot(50000)])).toBe(50000)
  })

  it('returns the sum of multiple pot allocations', () => {
    const pots = [makePot(50000, 1), makePot(30000, 2), makePot(20000, 3)]
    expect(sumPotAllocations(pots)).toBe(100000)
  })

  it('returns correct sum with 10 pots (multi-value precision test)', () => {
    const pots = Array.from({ length: 10 }, (_, i) => makePot(33333, i + 1))
    expect(sumPotAllocations(pots)).toBe(333330)
  })

  it('handles pots with zero allocation', () => {
    const pots = [makePot(0, 1), makePot(50000, 2), makePot(0, 3)]
    expect(sumPotAllocations(pots)).toBe(50000)
  })
})

describe('validatePotAllocations', () => {
  it('returns valid with remaining when under budget', () => {
    const pots = [makePot(100000, 1), makePot(80000, 2)]
    const result = validatePotAllocations(250000, pots)
    expect(result).toEqual({ valid: true, remaining: 70000 })
  })

  it('returns invalid with overAllocatedPence when over budget', () => {
    const pots = [makePot(150000, 1), makePot(150000, 2)]
    const result = validatePotAllocations(250000, pots)
    expect(result).toEqual({ valid: false, overAllocatedPence: 50000 })
  })

  it('returns valid with full income remaining when pots is empty', () => {
    const result = validatePotAllocations(250000, [])
    expect(result).toEqual({ valid: true, remaining: 250000 })
  })

  it('returns invalid when income is zero and pot has allocation', () => {
    const result = validatePotAllocations(0, [makePot(10000)])
    expect(result).toEqual({ valid: false, overAllocatedPence: 10000 })
  })

  it('returns valid with remaining 0 when allocations exactly match income', () => {
    const result = validatePotAllocations(100000, [makePot(100000)])
    expect(result).toEqual({ valid: true, remaining: 0 })
  })

  it('returns valid with remaining 0 when income is 0 and pots is empty', () => {
    const result = validatePotAllocations(0, [])
    expect(result).toEqual({ valid: true, remaining: 0 })
  })
})

describe('getPotBalance', () => {
  it('returns correct balance when partially spent', () => {
    expect(getPotBalance(50000, 30000)).toBe(20000)
  })

  it('returns full allocation when nothing spent', () => {
    expect(getPotBalance(50000, 0)).toBe(50000)
  })

  it('returns negative balance when overspent', () => {
    expect(getPotBalance(50000, 60000)).toBe(-10000)
  })

  it('returns 0 when all allocation is spent exactly', () => {
    expect(getPotBalance(50000, 50000)).toBe(0)
  })

  it('returns 0 when both allocated and spent are 0', () => {
    expect(getPotBalance(0, 0)).toBe(0)
  })
})
