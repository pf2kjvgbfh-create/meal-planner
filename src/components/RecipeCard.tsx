import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Recipe } from '../types/recipe'
import { CATEGORY_LABELS } from '../types/recipe'
import StarRating from './StarRating'
import { db } from '../db/database'

interface Props {
  recipe: Recipe
  onEdit: () => void
  onDelete: () => void
  onRatingChange: (id: number, rating: number) => void
  compact?: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  breakfast: 'bg-yellow-100 text-yellow-700',
  soup: 'bg-orange-100 text-orange-700',
  main: 'bg-green-100 text-green-700',
  salad: 'bg-emerald-100 text-emerald-700',
  dessert: 'bg-pink-100 text-pink-700',
  snack: 'bg-blue-100 text-blue-700',
}

export default function RecipeCard({ recipe, onEdit, onDelete, onRatingChange, compact }: Props) {
  async function handleRating(rating: number) {
    await db.recipes.update(recipe.id!, { rating })
    onRatingChange(recipe.id!, rating)
  }

  return (
    <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
      {recipe.photo && (
        <img
          src={recipe.photo}
          alt={recipe.name}
          className="w-full h-36 object-cover"
        />
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 text-base leading-tight truncate">{recipe.name}</h3>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[recipe.category]}`}>
              {CATEGORY_LABELS[recipe.category]}
            </span>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
              title="Редактировать"
            >
              ✏️
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
              title="Удалить"
            >
              🗑️
            </button>
          </div>
        </div>

        <StarRating value={recipe.rating} onChange={handleRating} />

        {!compact && (
          <>
            {recipe.ingredients.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Ингредиенты:</p>
                <p className="text-sm text-gray-700 line-clamp-2">
                  {recipe.ingredients.map((i) => `${i.name} ${i.amount} ${i.unit}`).join(', ')}
                </p>
              </div>
            )}

            {recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {recipe.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        <div className="text-xs text-gray-400">
          {recipe.lastCooked
            ? `Готовили ${formatDistanceToNow(new Date(recipe.lastCooked), { locale: ru, addSuffix: true })}`
            : 'Ещё не готовили'}
          {recipe.cookCount > 0 && ` · ${recipe.cookCount} раз`}
        </div>
      </div>
    </div>
  )
}
