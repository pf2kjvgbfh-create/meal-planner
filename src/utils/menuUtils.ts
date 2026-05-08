import type { DayMenu, MealSlot } from '../types/recipe'

export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']

/**
 * Normalize a DayMenu loaded from DB: convert legacy number slots to number[].
 * Old data: { lunch: 42 }  →  new: { lunch: [42] }
 */
export function normalizeDayMenu(day: Partial<DayMenu> & { date: number }): DayMenu {
  const result: DayMenu = { date: day.date }
  for (const slot of MEAL_SLOTS) {
    const val = (day as any)[slot]
    if (val === undefined || val === null) continue
    result[slot] = Array.isArray(val) ? val : [val as number]
  }
  return result
}

/** Collect all recipe IDs used across all days and all slots */
export function getSlotIds(days: Partial<DayMenu>[]): Set<number> {
  const ids = new Set<number>()
  for (const day of days) {
    for (const slot of MEAL_SLOTS) {
      for (const id of (day as any)[slot] ?? []) {
        ids.add(id)
      }
    }
  }
  return ids
}
