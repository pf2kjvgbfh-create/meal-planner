import { useState, useMemo, useEffect, useCallback } from 'react'
import { startOfWeek, addDays, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { db, updateWeekMenu, markCooked } from '../db/database'
import type { Recipe, DayMenu, MealSlot, WeeklyMenu, Category } from '../types/recipe'
import { MEAL_LABELS } from '../types/recipe'
import SuggestionModal from '../components/SuggestionModal'

const MEAL_TO_CATEGORY: Record<MealSlot, Category> = {
  breakfast: 'breakfast',
  lunch: 'soup',
  dinner: 'main',
}

function getWeekStart(offset = 0): number {
  const d = startOfWeek(addDays(new Date(), offset * 7), { weekStartsOn: 1 })
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function buildEmptyDays(weekStart: number): DayMenu[] {
  return Array.from({ length: 7 }, (_, i) => ({
    date: weekStart + i * 86400000,
  }))
}

export default function MenuPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset])

  const [modal, setModal] = useState<{ dayIndex: number; slot: MealSlot } | null>(null)
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
    days[modal.dayIndex] = { ...days[modal.dayIndex], [modal.slot]: recipe.id }
    const updated = { ...menu, days }
    await updateWeekMenu(updated)
    await markCooked(recipe.id!)
    setMenu(updated)
    setModal(null)
  }

  async function handleClear(dayIndex: number, slot: MealSlot) {
    if (!menu) return
    const days = [...menu.days]
    const day = { ...days[dayIndex] }
    delete day[slot]
    days[dayIndex] = day
    const updated = { ...menu, days }
    await updateWeekMenu(updated)
    setMenu(updated)
  }

  const weekLabel = useMemo(() => {
    const start = new Date(weekStart)
    const end = addDays(start, 6)
    return `${format(start, 'd MMM', { locale: ru })} – ${format(end, 'd MMM', { locale: ru })}`
  }, [weekStart])

  if (loading || !menu) {
    return <div className="p-4 text-center text-green-400">Загрузка...</div>
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-green-800">Меню</h1>
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
            <div className="bg-green-50 px-4 py-2 border-b border-green-100">
              <span className="font-semibold text-green-800 text-sm capitalize">
                {format(new Date(day.date), 'EEEE, d MMMM', { locale: ru })}
              </span>
            </div>
            <div className="divide-y divide-green-50">
              {(['breakfast', 'lunch', 'dinner'] as MealSlot[]).map((slot) => {
                const recipeId = day[slot]
                const recipe = recipeId ? recipeMap[recipeId] : undefined
                return (
                  <div key={slot} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xs text-gray-400 w-14 shrink-0">{MEAL_LABELS[slot]}</span>
                    {recipe ? (
                      <>
                        <span className="flex-1 text-sm text-gray-700 font-medium">{recipe.name}</span>
                        <button
                          onClick={() => handleClear(i, slot)}
                          className="text-gray-300 hover:text-red-400 text-lg leading-none shrink-0"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setModal({ dayIndex: i, slot })}
                        className="flex-1 text-left text-sm text-green-400 hover:text-green-600 transition-colors"
                      >
                        + Выбрать блюдо
                      </button>
                    )}
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
          category={MEAL_TO_CATEGORY[modal.slot]}
          onSelect={handleSelect}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
