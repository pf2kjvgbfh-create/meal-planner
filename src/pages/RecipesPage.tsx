import { useState, useEffect, useMemo, useCallback } from 'react'
import { db, deleteRecipe } from '../db/database'
import type { Recipe, Category } from '../types/recipe'
import { CATEGORY_LABELS } from '../types/recipe'
import RecipeCard from '../components/RecipeCard'
import RecipeForm from '../components/RecipeForm'

export default function RecipesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all')
  const [searchMode, setSearchMode] = useState<'name' | 'ingredient'>('name')
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([])

  const loadRecipes = useCallback(async () => {
    const recipes = await db.recipes.orderBy('name').toArray()
    setAllRecipes(recipes)
  }, [])

  useEffect(() => { loadRecipes() }, [loadRecipes])

  const filtered = useMemo(() => {
    if (!allRecipes) return []
    let list = allRecipes

    if (filterCategory !== 'all') {
      list = list.filter((r) => r.category === filterCategory)
    }

    const q = search.trim().toLowerCase()
    if (q) {
      if (searchMode === 'name') {
        list = list.filter((r) => r.name.toLowerCase().includes(q))
      } else {
        list = list.filter((r) =>
          r.ingredients.some((ing) => ing.name.toLowerCase().includes(q)) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
        )
      }
    }

    return list
  }, [allRecipes, search, filterCategory, searchMode])

  async function handleDelete(id: number) {
    if (confirm('Удалить этот рецепт?')) {
      await deleteRecipe(id)
      loadRecipes()
    }
  }

  function handleEdit(recipe: Recipe) {
    setEditingRecipe(recipe)
    setShowForm(true)
  }

  function handleFormClose() {
    setShowForm(false)
    setEditingRecipe(undefined)
    loadRecipes()
  }

  if (showForm) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-green-800 mb-4">
          {editingRecipe ? 'Редактировать рецепт' : 'Новый рецепт'}
        </h2>
        <RecipeForm
          initial={editingRecipe}
          onSaved={handleFormClose}
          onCancel={handleFormClose}
        />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-green-800">Рецепты</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
        >
          + Добавить
        </button>
      </div>

      {/* Поиск */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400">🔍</span>
            <input
              className="w-full border border-green-200 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchMode === 'name' ? 'Поиск по названию...' : 'Поиск по ингредиенту...'}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSearchMode('name')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              searchMode === 'name' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'
            }`}
          >
            По названию
          </button>
          <button
            onClick={() => setSearchMode('ingredient')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              searchMode === 'ingredient' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'
            }`}
          >
            По ингредиенту
          </button>
        </div>
      </div>

      {/* Фильтр по категории */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilterCategory('all')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filterCategory === 'all' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'
          }`}
        >
          Все
        </button>
        {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilterCategory(key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterCategory === key ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Список */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="text-5xl">🥗</div>
          <p className="text-gray-500">
            {allRecipes.length === 0
              ? 'Рецептов пока нет. Добавьте первый!'
              : 'Ничего не найдено'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">{filtered.length} рецептов</p>
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={() => handleEdit(recipe)}
              onDelete={() => recipe.id && handleDelete(recipe.id)}
              onRatingChange={() => loadRecipes()}
            />
          ))}
        </div>
      )}
    </div>
  )
}
