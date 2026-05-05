import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { startOfWeek, addDays, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { db, getOrCreateWeekMenu, updateWeekMenu, markCooked } from '../db/database'
import type { Recipe, DayMenu, MealSlot, Category } from '../types/recipe'
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

export default function MenuPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset])

  const [modal, setModal] = useState<{ dayIndex: number; slot: MealSlot } | null>(null)

  const allRecipes = useLiveQuery(() => db.recipes.toArray(), [])
  const menu = useLiveQuery(() => getOrCreateWeekMenu(weekStart), [weekStart])

  const recipeMap = useMemo(() => {
    const map: Record<number, Recipe> = {}
    allRecipes?.forEach((r) => { if (r.id) map[r.id] = r })
    return map
  }, [allRecipes])

  async function handleSelect(recipe: Recipe) {
    if (!modal || !menu) return
    const days = [...menu.days]
    days[modal.dayIndex] = { ...days[modal.dayIndex], [modal.slot]: recipe.id }
    await updateWeekMenu({ ...menu, days })
    await markCooked(recipe.id!)
    setModal(null)
  }

  async function handleClear(dayIndex: number, slot: MealSlot) {
    if (!menu) return
    const days = [...menu.days]
    const day = { ...days[dayIndex] }
    delete day[slot]
    days[dayIndex] = day
    await updateWeekMenu({ ...menu, days })
  }

  const weekLabel = useMemo(() => {
    const start = new Date(weekStart)
    const end = addDays(start, 6)
    return `${format(start, 'd MMM', { locale: ru })} – ${format(end, 'd MMM', { locale: ru })}`
  }, [weekStart])

  if (!menu || !allRecipes) {
    return <div className="p-4 text-center text-green-400">Загрузка...</div>
  }

  return (
    <div className="p-4 space-y-4">
      {/* Заголовок + навигация по неделям */}
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

      {/* Сетка меню */}
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

      {/* Модалка выбора блюда */}
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
