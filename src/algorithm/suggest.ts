import { differenceInDays } from 'date-fns'
import type { Recipe, Category } from '../types/recipe'

const VARIETY_THRESHOLD_DAYS = 14

export function scoreRecipe(recipe: Recipe): number {
  const now = new Date()

  // Дней с последней готовки (нормализованы к 30 дням)
  let dayScore = 0
  if (recipe.lastCooked === null) {
    dayScore = 1.0  // никогда не готовили — максимум
  } else {
    const days = differenceInDays(now, new Date(recipe.lastCooked))
    dayScore = Math.min(days / 30, 1.0)
  }

  // Оценка пользователя (нормализована к 5)
  const ratingScore = recipe.rating > 0 ? recipe.rating / 5 : 0.5

  // Бонус за давность (>14 дней без готовки)
  const varietyBonus = (recipe.lastCooked === null ||
    differenceInDays(now, new Date(recipe.lastCooked)) > VARIETY_THRESHOLD_DAYS)
    ? 1.0 : 0.0

  // Лёгкая случайность
  const random = Math.random()

  return dayScore * 0.4 + ratingScore * 0.3 + varietyBonus * 0.2 + random * 0.1
}

export function suggestRecipes(
  recipes: Recipe[],
  category: Category,
  count = 3,
): Recipe[] {
  return recipes
    .filter((r) => r.category === category)
    .map((r) => ({ recipe: r, score: scoreRecipe(r) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((x) => x.recipe)
}
