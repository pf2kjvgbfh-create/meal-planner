import { describe, it, expect } from 'vitest'
import { suggestRecipes } from './suggest'
import type { Recipe } from '../types/recipe'

function makeRecipe(id: number, overrides: Partial<Recipe> = {}): Recipe {
  return {
    id,
    name: `Recipe ${id}`,
    category: 'main',
    ingredients: [],
    steps: [],
    rating: 3,
    lastCooked: null,
    cookCount: 0,
    tags: [],
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('suggestRecipes', () => {
  it('returns empty array when no recipes match category', () => {
    const recipes = [makeRecipe(1, { category: 'soup' })]
    const result = suggestRecipes(recipes, ['main'], 5)
    expect(result).toHaveLength(0)
  })

  it('filters by category', () => {
    const recipes = [
      makeRecipe(1, { category: 'soup' }),
      makeRecipe(2, { category: 'main' }),
    ]
    const result = suggestRecipes(recipes, ['main'], 5)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
  })

  it('excludeIds removes recipes from results', () => {
    const recipes = [makeRecipe(1), makeRecipe(2), makeRecipe(3)]
    const result = suggestRecipes(recipes, null, 5, new Set([1, 2]))
    expect(result.map(r => r.id)).not.toContain(1)
    expect(result.map(r => r.id)).not.toContain(2)
    expect(result.map(r => r.id)).toContain(3)
  })

  it('priorityIds appear first in suggestions', () => {
    // Recipe 3 was recently cooked (low score), but it's in priorityIds
    const now = Date.now()
    const recipes = [
      makeRecipe(1, { lastCooked: null, rating: 5 }),
      makeRecipe(2, { lastCooked: null, rating: 5 }),
      makeRecipe(3, { lastCooked: now - 1000, rating: 1 }), // recently cooked, low rating
    ]
    const result = suggestRecipes(recipes, null, 5, new Set(), new Set([3]))
    expect(result[0].id).toBe(3) // priority recipe must be first
  })

  it('multiple priorityIds all appear before non-priority', () => {
    const recipes = [
      makeRecipe(1, { lastCooked: null, rating: 5 }),
      makeRecipe(2, { lastCooked: Date.now() - 1000, rating: 1 }),
      makeRecipe(3, { lastCooked: Date.now() - 2000, rating: 1 }),
    ]
    const result = suggestRecipes(recipes, null, 5, new Set(), new Set([2, 3]))
    expect([result[0].id, result[1].id]).toContain(2)
    expect([result[0].id, result[1].id]).toContain(3)
    expect(result[2].id).toBe(1)
  })

  it('priorityIds excluded by excludeIds are still excluded', () => {
    const recipes = [makeRecipe(1), makeRecipe(2)]
    // id=1 is both priority and excluded — excluded wins
    const result = suggestRecipes(recipes, null, 5, new Set([1]), new Set([1]))
    expect(result.map(r => r.id)).not.toContain(1)
  })
})
