import { useState, useMemo, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { startOfWeek, addDays, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { db, getOrCreateWeekMenu } from '../db/database'
import type { Recipe, Ingredient } from '../types/recipe'

interface ShoppingItem {
  name: string
  amount: number
  unit: string
  checked: boolean
}

function getWeekStart(offset = 0): number {
  const d = startOfWeek(addDays(new Date(), offset * 7), { weekStartsOn: 1 })
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function aggregateIngredients(recipes: Recipe[]): ShoppingItem[] {
  const map: Record<string, { amount: number; unit: string }> = {}
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const key = `${ing.name.toLowerCase()}::${ing.unit}`
      if (map[key]) {
        map[key].amount += ing.amount
      } else {
        map[key] = { amount: ing.amount, unit: ing.unit }
      }
    }
  }
  return Object.entries(map)
    .map(([key, val]) => ({
      name: key.split('::')[0],
      amount: val.amount,
      unit: val.unit,
      checked: false,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

export default function ShoppingListPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset])
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  const allRecipes = useLiveQuery(() => db.recipes.toArray(), [])
  const menu = useLiveQuery(() => getOrCreateWeekMenu(weekStart), [weekStart])

  const recipeMap = useMemo(() => {
    const map: Record<number, Recipe> = {}
    allRecipes?.forEach((r) => { if (r.id) map[r.id] = r })
    return map
  }, [allRecipes])

  const shoppingList = useMemo(() => {
    if (!menu || !allRecipes) return []
    const usedIds = new Set<number>()
    for (const day of menu.days) {
      if (day.breakfast) usedIds.add(day.breakfast)
      if (day.lunch) usedIds.add(day.lunch)
      if (day.dinner) usedIds.add(day.dinner)
    }
    const recipes = [...usedIds].map((id) => recipeMap[id]).filter(Boolean)
    return aggregateIngredients(recipes)
  }, [menu, recipeMap, allRecipes])

  const weekLabel = useMemo(() => {
    const start = new Date(weekStart)
    const end = addDays(start, 6)
    return `${format(start, 'd MMM', { locale: ru })} – ${format(end, 'd MMM', { locale: ru })}`
  }, [weekStart])

  function toggleItem(name: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const copyText = useCallback(() => {
    const text = shoppingList
      .map((i) => `${checkedItems.has(i.name) ? '✓' : '○'} ${i.name} — ${i.amount} ${i.unit}`)
      .join('\n')
    navigator.clipboard.writeText(`Список покупок (${weekLabel}):\n\n${text}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [shoppingList, checkedItems, weekLabel])

  const unchecked = shoppingList.filter((i) => !checkedItems.has(i.name))
  const checked = shoppingList.filter((i) => checkedItems.has(i.name))

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-green-800">Покупки</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="p-2 rounded-xl hover:bg-green-100 text-green-600"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-green-700 min-w-[110px] text-center">{weekLabel}</span>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="p-2 rounded-xl hover:bg-green-100 text-green-600"
          >
            ›
          </button>
        </div>
      </div>

      {shoppingList.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="text-5xl">🛒</div>
          <p className="text-gray-500">Меню на эту неделю пустое.<br />Сначала составьте меню.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {unchecked.length} из {shoppingList.length} позиций осталось
            </p>
            <button
              onClick={copyText}
              className="text-sm bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-xl transition-colors"
            >
              {copied ? '✓ Скопировано!' : '📋 Скопировать'}
            </button>
          </div>

          {/* Прогресс-бар */}
          <div className="h-2 bg-green-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-400 rounded-full transition-all"
              style={{ width: `${(checked.length / shoppingList.length) * 100}%` }}
            />
          </div>

          {/* Не купленное */}
          <div className="space-y-2">
            {unchecked.map((item) => (
              <button
                key={item.name}
                onClick={() => toggleItem(item.name)}
                className="w-full flex items-center gap-3 bg-white border border-green-100 rounded-xl px-4 py-3 hover:bg-green-50 transition-colors text-left"
              >
                <span className="w-5 h-5 rounded-full border-2 border-green-300 shrink-0" />
                <span className="flex-1 text-sm font-medium text-gray-800 capitalize">{item.name}</span>
                <span className="text-sm text-gray-400">{item.amount} {item.unit}</span>
              </button>
            ))}
          </div>

          {/* Купленное */}
          {checked.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Куплено</p>
              {checked.map((item) => (
                <button
                  key={item.name}
                  onClick={() => toggleItem(item.name)}
                  className="w-full flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="w-5 h-5 rounded-full bg-green-400 shrink-0 flex items-center justify-center text-white text-xs">✓</span>
                  <span className="flex-1 text-sm text-gray-400 line-through capitalize">{item.name}</span>
                  <span className="text-sm text-gray-300">{item.amount} {item.unit}</span>
                </button>
              ))}
            </div>
          )}

          {checked.length > 0 && (
            <button
              onClick={() => setCheckedItems(new Set())}
              className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 text-center"
            >
              Снять все отметки
            </button>
          )}
        </>
      )}
    </div>
  )
}
