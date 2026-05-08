import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { startOfWeek, addDays, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  db,
  getCustomShoppingItems,
  addCustomShoppingItem,
  toggleCustomShoppingItem,
  deleteCustomShoppingItem,
} from '../db/database'
import type { Recipe, WeeklyMenu, CustomShoppingItem } from '../types/recipe'
import { normalizeDayMenu } from '../utils/menuUtils'
import { getSlotIds } from '../utils/menuUtils'

interface ShoppingItem {
  name: string
  amount: number
  unit: string
}

function getWeekStart(offset = 0): number {
  // weekStartsOn: 0 = Sunday
  const d = startOfWeek(addDays(new Date(), offset * 7), { weekStartsOn: 0 })
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
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

export default function ShoppingListPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset])
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([])
  const [menu, setMenu] = useState<WeeklyMenu | null>(null)
  const [customItems, setCustomItems] = useState<CustomShoppingItem[]>([])
  const [newItemName, setNewItemName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const recipes = await db.recipes.toArray()
      setAllRecipes(recipes)
      const m = await db.weeklyMenus.where('weekStart').equals(weekStart).first()
      if (m) {
        setMenu({ ...m, days: m.days.map(normalizeDayMenu) })
      } else {
        setMenu(null)
      }
      setCustomItems(await getCustomShoppingItems(weekStart))
    }
    load()
  }, [weekStart])

  const recipeMap = useMemo(() => {
    const map: Record<number, Recipe> = {}
    allRecipes.forEach((r) => { if (r.id) map[r.id] = r })
    return map
  }, [allRecipes])

  const shoppingList = useMemo(() => {
    if (!menu) return []
    const usedIds = getSlotIds(menu.days)
    const recipes = [...usedIds].map((id) => recipeMap[id]).filter(Boolean)
    return aggregateIngredients(recipes)
  }, [menu, recipeMap])

  const weekLabel = useMemo(() => {
    const start = new Date(weekStart)
    const end = addDays(start, 6)
    return `${format(start, 'd MMM', { locale: ru })} – ${format(end, 'd MMM', { locale: ru })}`
  }, [weekStart])

  function toggleItem(key: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  async function handleToggleCustom(item: CustomShoppingItem) {
    await toggleCustomShoppingItem(item.id!, !item.checked)
    setCustomItems((prev) => prev.map((i) => i.id === item.id ? { ...i, checked: !i.checked } : i))
  }

  async function handleDeleteCustom(id: number) {
    await deleteCustomShoppingItem(id)
    setCustomItems((prev) => prev.filter((i) => i.id !== id))
  }

  async function handleAddCustom(e: React.FormEvent) {
    e.preventDefault()
    const name = newItemName.trim()
    if (!name) return
    const item = await addCustomShoppingItem(weekStart, name)
    setCustomItems((prev) => [...prev, item])
    setNewItemName('')
    inputRef.current?.focus()
  }

  const totalCount = shoppingList.length + customItems.length
  const checkedCount = shoppingList.filter((i) => checkedItems.has(i.name)).length +
    customItems.filter((i) => i.checked).length

  const copyText = useCallback(() => {
    const recipeLines = shoppingList
      .map((i) => `${checkedItems.has(i.name) ? '✓' : '○'} ${i.name} — ${i.amount} ${i.unit}`)
      .join('\n')
    const customLines = customItems
      .map((i) => `${i.checked ? '✓' : '○'} ${i.name}`)
      .join('\n')
    const body = [recipeLines, customLines].filter(Boolean).join('\n')
    navigator.clipboard.writeText(`Список покупок (${weekLabel}):\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [shoppingList, customItems, checkedItems, weekLabel])

  const uncheckedRecipe = shoppingList.filter((i) => !checkedItems.has(i.name))
  const checkedRecipe = shoppingList.filter((i) => checkedItems.has(i.name))
  const uncheckedCustom = customItems.filter((i) => !i.checked)
  const checkedCustom = customItems.filter((i) => i.checked)

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

      {/* Add custom item */}
      <form onSubmit={handleAddCustom} className="flex gap-2">
        <input
          ref={inputRef}
          className="flex-1 border border-green-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          placeholder="Добавить покупку..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          style={{ fontSize: '16px' }}
        />
        <button
          type="submit"
          disabled={!newItemName.trim()}
          className="px-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-green-200 text-white rounded-xl text-sm font-medium transition-colors"
        >
          +
        </button>
      </form>

      {totalCount === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="text-5xl">🛒</div>
          <p className="text-gray-500">Список пуст.<br />Составьте меню или добавьте покупки выше.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {totalCount - checkedCount} из {totalCount} позиций осталось
            </p>
            <button
              onClick={copyText}
              className="text-sm bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-xl transition-colors"
            >
              {copied ? '✓ Скопировано!' : '📋 Скопировать'}
            </button>
          </div>

          <div className="h-2 bg-green-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-400 rounded-full transition-all"
              style={{ width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : '0%' }}
            />
          </div>

          {/* Unchecked recipe ingredients */}
          {uncheckedRecipe.length > 0 && (
            <div className="space-y-2">
              {uncheckedRecipe.map((item) => (
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
          )}

          {/* Unchecked custom items */}
          {uncheckedCustom.length > 0 && (
            <div className="space-y-2">
              {uncheckedRecipe.length > 0 && (
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Своё</p>
              )}
              {uncheckedCustom.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleCustom(item)}
                    className="flex-1 flex items-center gap-3 bg-white border border-green-100 rounded-xl px-4 py-3 hover:bg-green-50 transition-colors text-left"
                  >
                    <span className="w-5 h-5 rounded-full border-2 border-green-300 shrink-0" />
                    <span className="flex-1 text-sm font-medium text-gray-800">{item.name}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCustom(item.id!)}
                    className="text-gray-300 hover:text-red-400 text-lg px-2 shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Checked items */}
          {(checkedRecipe.length > 0 || checkedCustom.length > 0) && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Куплено</p>
              {checkedRecipe.map((item) => (
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
              {checkedCustom.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleCustom(item)}
                    className="flex-1 flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors text-left"
                  >
                    <span className="w-5 h-5 rounded-full bg-green-400 shrink-0 flex items-center justify-center text-white text-xs">✓</span>
                    <span className="flex-1 text-sm text-gray-400 line-through">{item.name}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCustom(item.id!)}
                    className="text-gray-200 hover:text-red-400 text-lg px-2 shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {(checkedRecipe.length > 0 || checkedCustom.length > 0) && (
            <button
              onClick={() => {
                setCheckedItems(new Set())
                setCustomItems((prev) => prev.map((i) => ({ ...i, checked: false })))
                customItems.forEach((i) => { if (i.checked) toggleCustomShoppingItem(i.id!, false) })
              }}
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
