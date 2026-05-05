export type Category = 'breakfast' | 'soup' | 'main' | 'salad' | 'dessert' | 'snack'

export const CATEGORY_LABELS: Record<Category, string> = {
  breakfast: 'Завтрак',
  soup: 'Суп',
  main: 'Второе',
  salad: 'Салат',
  dessert: 'Десерт',
  snack: 'Перекус',
}

export interface Ingredient {
  name: string
  amount: number
  unit: string
}

export interface Recipe {
  id?: number
  name: string
  category: Category
  ingredients: Ingredient[]
  steps: string[]
  rating: number      // 1-5, 0 = не оценено
  lastCooked: number | null  // timestamp
  cookCount: number
  tags: string[]
  createdAt: number
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
}

// Какие категории рецептов предлагать для каждого приёма пищи
export const SLOT_CATEGORIES: Record<MealSlot, Category[]> = {
  breakfast: ['breakfast', 'dessert'],
  lunch: ['soup', 'main', 'salad'],
  dinner: ['main', 'salad'],
  snack: ['dessert', 'salad', 'snack'],
}

export interface DayMenu {
  date: number  // timestamp, start of day
  breakfast?: number
  lunch?: number
  dinner?: number
  snack?: number
}

export interface WeeklyMenu {
  id?: number
  weekStart: number  // timestamp, Monday
  days: DayMenu[]
  createdAt: number
}

export interface CookHistory {
  id?: number
  recipeId: number
  cookedAt: number  // timestamp
}
