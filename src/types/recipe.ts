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

export type MealSlot = 'breakfast' | 'lunch' | 'dinner'

export const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
}

export interface DayMenu {
  date: number  // timestamp, start of day
  breakfast?: number
  lunch?: number
  dinner?: number
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
