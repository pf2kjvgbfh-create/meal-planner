import { useState, useMemo, useEffect, useCallback } from 'react'
import { startOfWeek, addDays, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { db, updateWeekMenu, markCooked } from '../db/database'
import type { Recipe, DayMenu, MealSlot, WeeklyMenu, Category } from '../types/recipe'
import { MEAL_LABELS, SLOT_CATEGORIES } from '../types/recipe'
import { normalizeDayMenu, MEAL_SLOTS, getSlotIds } from '../utils/menuUtils'
import SuggestionModal from '../components/SuggestionModal'

function getWeekStart(offset = 0): number {
  // weekStartsOn: 0 = Sunday
  const d = startOfWeek(addDays(new Date(), offset * 7), { weekStartsOn: 0 })
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function buildEmptyDays(weekStart: number): DayMenu[] {
  return Array.from({ length: 7 }, (_, i) => ({
    date: weekStart + i * 86400000,
  }))
}

interface ModalState {
  dayIndex: number
  slot: MealSlot
  categories: Category[]
  priorityIds: Set<number>
}

export default function MenuPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset])

  const [modal, setModal] = useState<ModalState | null>(null)
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([])
  const [menu, setMenu] = useState<WeeklyMenu | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const recipes = await db.recipes.toArray()
      setAllRecipes(recipes)

      let existing = await db.weeklyMenus.where('weekStart').equals(weekStart).first()
      if (!existing) {
        const newMenu: WeeklyMenu = {
          weekStart,
          days: buildEmptyDays(weekStart),
          createdAt: Date.now(),
        }
        newMenu.id = await db.weeklyMenus.add(newMenu)
        existing = newMenu
      } else {
        // normalize legacy number slots → arrays
        existing = { ...existing, days: existing.days.map(normalizeDayMenu) }
      }
      setMenu(existing)
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => { loadData() }, [loadData])

  const recipeMap = useMemo(() => {
    const map: Record<number, Recipe> = {}
    allRecipes.forEach((r) => { if (r.id) map[r.id] = r })
    return map
  }, [allRecipes])

  async function handleSelect(recipe: Recipe) {
    if (!modal || !menu) return
    const days = [...menu.days]
    const day = { ...days[modal.dayIndex] }
    const existing = day[modal.slot] ?? []
    // avoid duplicate in same slot
    if (!existing.includes(recipe.id!)) {
      day[modal.slot] = [...existing, recipe.id!]
    }
    days[modal.dayIndex] = day
    const updated = { ...menu, days }
    await updateWeekMenu(updated)
    await markCooked(recipe.id!)
    setMenu(updated)
    setModal(null)
  }

  async function handleRemoveDish(dayIndex: number, slot: MealSlot, recipeId: number) {
    if (!menu) return
    const days = [...menu.days]
    const day = { ...days[dayIndex] }
    const current = day[slot] ?? []
    const next = current.filter((id) => id !== recipeId)
    if (next.length === 0) {
      delete day[slot]
    } else {
      day[slot] = next
    }
    days[dayIndex] = day
    const updated = { ...menu, days }
    await updateWeekMenu(updated)
    setMenu(updated)
  }

  function openModal(dayIndex: number, slot: MealSlot) {
    if (!menu) return
    // Yesterday = previous day in the week array (or empty if it's day 0)
    const priorityIds = new Set<number>()
    if (dayIndex > 0) {
      const yesterday = menu.days[dayIndex - 1]
      for (const id of yesterday[slot] ?? []) {
        priorityIds.add(id)
      }
    }
    setModal({ dayIndex, slot, categories: SLOT_CATEGORIES[slot], priorityIds })
  }

  const weekLabel = useMemo(() => {
    const start = new Date(weekStart)
    const end = addDays(start, 6)
    return `${format(start, 'd MMM', { locale: ru })} – ${format(end, 'd MMM', { locale: ru })}`
  }, [weekStart])

  // All used IDs across the whole week (for exclude in suggestions)
  const usedRecipeIds = useMemo(() => {
    if (!menu) return new Set<number>()
    return getSlotIds(menu.days)
  }, [menu])

  if (loading || !menu) {
    return <div className="p-4 text-center text-green-400">Загрузка...</div>
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Меню</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="p-2 rounded-xl hover:bg-green-100 text-green-600 transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-green-700 min-w-[110px] text-center">{weekLabel}</span>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="p-2 rounded-xl hover:bg-green-100 text-green-600 transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {weekOffset !== 0 && (
        <button
          onClick={() => setWeekOffset(0)}
          className="text-xs text-green-500 underline"
        >
          Вернуться к текущей неделе
        </button>
      )}

      <div className="space-y-3">
        {menu.days.map((day: DayMenu, i: number) => (
          <div key={day.date} className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
            <div className="bg-stone-50 px-4 py-2 border-b border-stone-100">
              <span className="font-semibold text-gray-800 text-sm capitalize">
                {format(new Date(day.date), 'EEEE, d MMMM', { locale: ru })}
              </span>
            </div>
            <div className="divide-y divide-green-50">
              {MEAL_SLOTS.map((slot) => {
                const ids = day[slot] ?? []
                return (
                  <div key={slot} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xs text-gray-400 w-14 shrink-0 pt-0.5">{MEAL_LABELS[slot]}</span>
                      <div className="flex-1 space-y-1">
                        {ids.map((recipeId) => {
                          const recipe = recipeMap[recipeId]
                          if (!recipe) return null
                          return (
                            <div key={recipeId} className="flex items-center gap-2">
                              <span className="flex-1 text-sm text-gray-700 font-medium">{recipe.name}</span>
                              <button
                                onClick={() => handleRemoveDish(i, slot, recipeId)}
                                className="text-gray-300 hover:text-red-400 text-lg leading-none shrink-0"
                              >
                                ×
                              </button>
                            </div>
                          )
                        })}
                        <button
                          onClick={() => openModal(i, slot)}
                          className="text-sm text-green-400 hover:text-green-600 transition-colors"
                        >
                          + {ids.length === 0 ? 'Выбрать блюдо' : 'Добавить блюдо'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <SuggestionModal
          recipes={allRecipes}
          categories={modal.categories}
          excludeIds={usedRecipeIds}
          priorityIds={modal.priorityIds}
          onSelect={handleSelect}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
