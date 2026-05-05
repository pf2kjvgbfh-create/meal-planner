import Dexie, { type Table } from 'dexie'
import type { Recipe, WeeklyMenu, CookHistory } from '../types/recipe'

class MealPlannerDB extends Dexie {
  recipes!: Table<Recipe>
  weeklyMenus!: Table<WeeklyMenu>
  cookHistory!: Table<CookHistory>

  constructor() {
    super('MealPlannerDB')
    this.version(1).stores({
      recipes: '++id, name, category, rating, lastCooked, cookCount, createdAt, *tags',
      weeklyMenus: '++id, weekStart, createdAt',
      cookHistory: '++id, recipeId, cookedAt',
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
  if (existing) return existing

  const days = Array.from({ length: 7 }, (_, i) => ({
    date: weekStart + i * 86400000,
  }))
  const id = await db.weeklyMenus.add({ weekStart, days, createdAt: Date.now() })
  return { id, weekStart, days, createdAt: Date.now() }
}

export async function updateWeekMenu(menu: WeeklyMenu): Promise<void> {
  await db.weeklyMenus.put(menu)
}

// === Экспорт / Импорт данных ===

export async function exportAllData(): Promise<string> {
  const recipes = await db.recipes.toArray()
  const weeklyMenus = await db.weeklyMenus.toArray()
  const cookHistory = await db.cookHistory.toArray()
  return JSON.stringify({ recipes, weeklyMenus, cookHistory, exportedAt: Date.now() }, null, 2)
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
