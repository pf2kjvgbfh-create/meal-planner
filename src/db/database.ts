import Dexie, { type Table } from 'dexie'
import type { Recipe, WeeklyMenu, CookHistory, CustomShoppingItem } from '../types/recipe'
import { normalizeDayMenu } from '../utils/menuUtils'

class MealPlannerDB extends Dexie {
  recipes!: Table<Recipe>
  weeklyMenus!: Table<WeeklyMenu>
  cookHistory!: Table<CookHistory>
  customShoppingItems!: Table<CustomShoppingItem>

  constructor() {
    super('MealPlannerDB')
    this.version(1).stores({
      recipes: '++id, name, category, rating, lastCooked, cookCount, createdAt, *tags',
      weeklyMenus: '++id, weekStart, createdAt',
      cookHistory: '++id, recipeId, cookedAt',
    })
    this.version(2).stores({
      recipes: '++id, name, category, rating, lastCooked, cookCount, createdAt, *tags',
      weeklyMenus: '++id, weekStart, createdAt',
      cookHistory: '++id, recipeId, cookedAt',
      customShoppingItems: '++id, weekStart, createdAt',
    })
  }
}

export const db = new MealPlannerDB()

export async function getRecipeById(id: number): Promise<Recipe | undefined> {
  return db.recipes.get(id)
}

export async function saveRecipe(recipe: Recipe): Promise<number> {
  if (recipe.id) {
    await db.recipes.put(recipe)
    return recipe.id
  }
  return db.recipes.add({ ...recipe, createdAt: Date.now() })
}

export async function deleteRecipe(id: number): Promise<void> {
  await db.recipes.delete(id)
}

export async function markCooked(recipeId: number): Promise<void> {
  const now = Date.now()
  await db.recipes.update(recipeId, {
    lastCooked: now,
    cookCount: ((await db.recipes.get(recipeId))?.cookCount ?? 0) + 1,
  })
  await db.cookHistory.add({ recipeId, cookedAt: now })
}

export async function getOrCreateWeekMenu(weekStart: number): Promise<WeeklyMenu> {
  const existing = await db.weeklyMenus.where('weekStart').equals(weekStart).first()
  if (existing) {
    // normalize legacy number slots → number[] on load
    return { ...existing, days: existing.days.map(normalizeDayMenu) }
  }

  const days = Array.from({ length: 7 }, (_, i) => ({
    date: weekStart + i * 86400000,
  }))
  const id = await db.weeklyMenus.add({ weekStart, days, createdAt: Date.now() })
  return { id, weekStart, days, createdAt: Date.now() }
}

export async function updateWeekMenu(menu: WeeklyMenu): Promise<void> {
  await db.weeklyMenus.put(menu)
}

// === Custom shopping items ===

export async function getCustomShoppingItems(weekStart: number): Promise<CustomShoppingItem[]> {
  return db.customShoppingItems.where('weekStart').equals(weekStart).toArray()
}

export async function addCustomShoppingItem(weekStart: number, name: string): Promise<CustomShoppingItem> {
  const item: CustomShoppingItem = { weekStart, name: name.trim(), checked: false, createdAt: Date.now() }
  item.id = await db.customShoppingItems.add(item)
  return item
}

export async function toggleCustomShoppingItem(id: number, checked: boolean): Promise<void> {
  await db.customShoppingItems.update(id, { checked })
}

export async function deleteCustomShoppingItem(id: number): Promise<void> {
  await db.customShoppingItems.delete(id)
}

// === Экспорт / Импорт данных ===

export async function exportAllData(): Promise<string> {
  const recipes = await db.recipes.toArray()
  const weeklyMenus = await db.weeklyMenus.toArray()
  const cookHistory = await db.cookHistory.toArray()
  const customShoppingItems = await db.customShoppingItems.toArray()
  return JSON.stringify({ recipes, weeklyMenus, cookHistory, customShoppingItems, exportedAt: Date.now() }, null, 2)
}

export async function importAllData(json: string): Promise<{ recipes: number; menus: number }> {
  const data = JSON.parse(json)
  let recipesCount = 0
  let menusCount = 0

  if (data.recipes?.length) {
    await db.recipes.clear()
    await db.recipes.bulkAdd(data.recipes)
    recipesCount = data.recipes.length
  }
  if (data.weeklyMenus?.length) {
    await db.weeklyMenus.clear()
    await db.weeklyMenus.bulkAdd(data.weeklyMenus)
    menusCount = data.weeklyMenus.length
  }
  if (data.cookHistory?.length) {
    await db.cookHistory.clear()
    await db.cookHistory.bulkAdd(data.cookHistory)
  }
  if (data.customShoppingItems?.length) {
    await db.customShoppingItems.clear()
    await db.customShoppingItems.bulkAdd(data.customShoppingItems)
  }
  return { recipes: recipesCount, menus: menusCount }
}

export async function getAllIngredientNames(): Promise<string[]> {
  const recipes = await db.recipes.toArray()
  const names = new Set<string>()
  for (const r of recipes) {
    for (const ing of r.ingredients) {
      names.add(ing.name.toLowerCase().trim())
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'ru'))
}
