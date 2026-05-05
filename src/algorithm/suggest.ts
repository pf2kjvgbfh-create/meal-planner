import { differenceInDays } from 'date-fns'
import type { Recipe, Category } from '../types/recipe'

const VARIETY_THRESHOLD_DAYS = 14

export function scoreRecipe(recipe: Recipe, excludeIds: Set<number> = new Set()): number {
  if (recipe.id && excludeIds.has(recipe.id)) return -1

  const now = new Date()

  let dayScore = 0
  if (recipe.lastCooked === null) {
    dayScore = 1.0
  } else {
    const days = differenceInDays(now, new Date(recipe.lastCooked))
    dayScore = Math.min(days / 30, 1.0)
  }

  const ratingScore = recipe.rating > 0 ? recipe.rating / 5 : 0.5

  const varietyBonus = (recipe.lastCooked === null ||
    differenceInDays(now, new Date(recipe.lastCooked)) > VARIETY_THRESHOLD_DAYS)
    ? 1.0 : 0.0

  const random = Math.random()

  return dayScore * 0.4 + ratingScore * 0.3 + varietyBonus * 0.2 + random * 0.1
}

export function suggestRecipes(
  recipes: Recipe[],
  categories: Category[] | null,
  count = 5,
  excludeIds: Set<number> = new Set(),
): Recipe[] {
  return recipes
    .filter((r) => categories === null || categories.includes(r.category))
    .map((r) => ({ recipe: r, score: scoreRecipe(r, excludeIds) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((x) => x.recipe)
}
