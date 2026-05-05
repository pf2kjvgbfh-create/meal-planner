import { useMemo, useState } from 'react'
import type { Recipe, Category } from '../types/recipe'
import { CATEGORY_LABELS } from '../types/recipe'
import { suggestRecipes } from '../algorithm/suggest'
import StarRating from './StarRating'

interface Props {
  recipes: Recipe[]
  category: Category
  onSelect: (recipe: Recipe) => void
  onClose: () => void
}

export default function SuggestionModal({ recipes, category, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'suggest' | 'search'>('suggest')

  const suggestions = useMemo(() => suggestRecipes(recipes, category, 5), [recipes, category])

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q))
    )
  }, [recipes, search])

  const displayList = tab === 'suggest' ? suggestions : searchResults

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-0" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl p-5 space-y-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-green-800 text-lg">
            Выбрать блюдо · {CATEGORY_LABELS[category]}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTab('suggest')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'suggest' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'
            }`}
          >
            ✨ Предложения
          </button>
          <button
            onClick={() => setTab('search')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'search' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'
            }`}
          >
            🔍 Поиск
          </button>
        </div>

        {tab === 'search' && (
          <input
            autoFocus
            className="border border-green-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Название или ингредиент..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}

        <div className="overflow-y-auto flex-1 space-y-2">
          {tab === 'suggest' && suggestions.length === 0 && (
            <p className="text-center text-gray-400 py-8">
              Нет рецептов в категории «{CATEGORY_LABELS[category]}»
            </p>
          )}
          {tab === 'search' && !search && (
            <p className="text-center text-gray-400 py-8">Введите название или ингредиент</p>
          )}
          {displayList.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => onSelect(recipe)}
              className="w-full text-left bg-green-50 hover:bg-green-100 rounded-xl p-3 transition-colors"
            >
              <div className="font-medium text-gray-800 text-sm">{recipe.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <StarRating value={recipe.rating} readonly />
                {recipe.lastCooked ? (
                  <span className="text-xs text-gray-400">
                    {Math.floor((Date.now() - recipe.lastCooked) / 86400000)} дн. назад
                  </span>
                ) : (
                  <span className="text-xs text-green-500">Ещё не готовили</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
