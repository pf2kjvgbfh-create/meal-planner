import { useState } from 'react'
import type { Recipe, Ingredient, Category } from '../types/recipe'
import { CATEGORY_LABELS } from '../types/recipe'
import { saveRecipe } from '../db/database'
import StarRating from './StarRating'

interface Props {
  initial?: Recipe
  onSaved: (recipe: Recipe) => void
  onCancel: () => void
}

const EMPTY_INGREDIENT: Ingredient = { name: '', amount: 0, unit: 'г' }

const UNITS = ['г', 'кг', 'мл', 'л', 'шт', 'ст.л.', 'ч.л.', 'стакан', 'щепотка']

export default function RecipeForm({ initial, onSaved, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<Category>(initial?.category ?? 'main')
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initial?.ingredients?.length ? initial.ingredients : [{ ...EMPTY_INGREDIENT }]
  )
  const [steps, setSteps] = useState<string[]>(
    initial?.steps?.length ? initial.steps : ['']
  )
  const [rating, setRating] = useState(initial?.rating ?? 0)
  const [tags, setTags] = useState(initial?.tags?.join(', ') ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateIngredient(i: number, field: keyof Ingredient, value: string | number) {
    setIngredients((prev) => prev.map((ing, idx) =>
      idx === i ? { ...ing, [field]: value } : ing
    ))
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { ...EMPTY_INGREDIENT }])
  }

  function removeIngredient(i: number) {
    setIngredients((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateStep(i: number, value: string) {
    setSteps((prev) => prev.map((s, idx) => idx === i ? value : s))
  }

  function addStep() {
    setSteps((prev) => [...prev, ''])
  }

  function removeStep(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Введите название блюда'); return }
    if (ingredients.some((ing) => !ing.name.trim())) {
      setError('Заполните все названия ингредиентов')
      return
    }

    setSaving(true)
    setError('')
    try {
      const recipe: Recipe = {
        ...(initial ?? {}),
        name: name.trim(),
        category,
        ingredients: ingredients.filter((ing) => ing.name.trim()),
        steps: steps.filter((s) => s.trim()),
        rating,
        lastCooked: initial?.lastCooked ?? null,
        cookCount: initial?.cookCount ?? 0,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        createdAt: initial?.createdAt ?? Date.now(),
      }
      const id = await saveRecipe(recipe)
      onSaved({ ...recipe, id })
    } catch {
      setError('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Название */}
      <div>
        <label className="block text-sm font-medium text-green-800 mb-1">Название блюда *</label>
        <input
          className="w-full border border-green-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Борщ с говядиной"
        />
      </div>

      {/* Категория */}
      <div>
        <label className="block text-sm font-medium text-green-800 mb-1">Категория</label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === key
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Оценка */}
      <div>
        <label className="block text-sm font-medium text-green-800 mb-1">Оценка</label>
        <StarRating value={rating} onChange={setRating} />
      </div>

      {/* Ингредиенты */}
      <div>
        <label className="block text-sm font-medium text-green-800 mb-2">Ингредиенты</label>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                className="flex-1 border border-green-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm bg-white"
                value={ing.name}
                onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                placeholder="Говядина"
              />
              <input
                type="number"
                min="0"
                className="w-20 border border-green-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm bg-white"
                value={ing.amount || ''}
                onChange={(e) => updateIngredient(i, 'amount', parseFloat(e.target.value) || 0)}
                placeholder="500"
              />
              <select
                className="w-24 border border-green-200 rounded-xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm bg-white"
                value={ing.unit}
                onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  className="text-red-400 hover:text-red-600 text-lg leading-none px-1"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="mt-2 text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1"
        >
          + Добавить ингредиент
        </button>
      </div>

      {/* Шаги */}
      <div>
        <label className="block text-sm font-medium text-green-800 mb-2">Шаги приготовления</label>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-2.5 text-green-500 font-bold text-sm w-5 shrink-0">{i + 1}.</span>
              <textarea
                className="flex-1 border border-green-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm bg-white resize-none"
                rows={2}
                value={step}
                onChange={(e) => updateStep(i, e.target.value)}
                placeholder={`Шаг ${i + 1}...`}
              />
              {steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  className="mt-2 text-red-400 hover:text-red-600 text-lg leading-none px-1"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addStep}
          className="mt-2 text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1"
        >
          + Добавить шаг
        </button>
      </div>

      {/* Теги */}
      <div>
        <label className="block text-sm font-medium text-green-800 mb-1">
          Теги <span className="text-green-500 font-normal">(через запятую)</span>
        </label>
        <input
          className="w-full border border-green-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-sm"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="говядина, духовка, быстро"
        />
      </div>

      {/* Кнопки */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {saving ? 'Сохранение...' : initial ? 'Сохранить изменения' : 'Добавить рецепт'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-green-200 text-green-700 rounded-xl hover:bg-green-50 transition-colors"
        >
          Отмена
        </button>
      </div>
    </form>
  )
}
