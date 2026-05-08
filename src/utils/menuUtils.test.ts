import { describe, it, expect } from 'vitest'
import { normalizeDayMenu, getSlotIds } from './menuUtils'

describe('normalizeDayMenu', () => {
  it('converts legacy number slots to arrays', () => {
    const legacy = { date: 1000, breakfast: 5 as any, lunch: 10 as any }
    const result = normalizeDayMenu(legacy)
    expect(result.breakfast).toEqual([5])
    expect(result.lunch).toEqual([10])
  })

  it('leaves arrays unchanged', () => {
    const modern = { date: 1000, breakfast: [5, 6], lunch: [10] }
    const result = normalizeDayMenu(modern)
    expect(result.breakfast).toEqual([5, 6])
    expect(result.lunch).toEqual([10])
  })

  it('leaves undefined slots as undefined', () => {
    const day = { date: 1000 }
    const result = normalizeDayMenu(day)
    expect(result.breakfast).toBeUndefined()
    expect(result.lunch).toBeUndefined()
  })

  it('preserves date', () => {
    const day = { date: 99999 }
    expect(normalizeDayMenu(day).date).toBe(99999)
  })
})

describe('getSlotIds', () => {
  it('collects all recipe IDs from all slots across days', () => {
    const days = [
      { date: 1, breakfast: [1, 2], lunch: [3] },
      { date: 2, dinner: [4], snack: [5, 6] },
    ]
    const ids = getSlotIds(days)
    expect(ids).toEqual(new Set([1, 2, 3, 4, 5, 6]))
  })

  it('returns empty set for empty menu', () => {
    expect(getSlotIds([])).toEqual(new Set())
  })

  it('handles days with no slots filled', () => {
    const days = [{ date: 1 }, { date: 2 }]
    expect(getSlotIds(days)).toEqual(new Set())
  })
})
