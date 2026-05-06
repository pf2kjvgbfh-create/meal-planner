import { useState, useRef } from 'react'
import { exportAllData, importAllData } from '../db/database'

export default function SettingsPage() {
  const [status, setStatus] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    try {
      const json = await exportAllData()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meal-planner-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setStatus('Резервная копия сохранена!')
    } catch {
      setStatus('Ошибка при экспорте')
    }
  }

  async function handleImport() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    try {
      const json = await file.text()
      const result = await importAllData(json)
      setStatus(`Восстановлено: ${result.recipes} рецептов, ${result.menus} меню`)
    } catch {
      setStatus('Ошибка: файл повреждён или неверного формата')
    }
  }

  async function handleUpdate() {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.update()
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      }
    }
    window.location.reload()
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Настройки</h1>

      <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-4">
        <h2 className="font-semibold text-gray-700">Резервная копия</h2>
        <p className="text-sm text-gray-500">
          Сохраните все рецепты, меню и историю в файл.
          Можно восстановить на другом устройстве или после обновления.
        </p>

        <button
          onClick={handleExport}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Скачать резервную копию
        </button>

        <div className="border-t border-stone-100 pt-4 space-y-3">
          <p className="text-sm text-gray-500">
            Восстановить данные из файла (заменит текущие данные):
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-stone-100 file:text-gray-700 file:font-medium hover:file:bg-stone-200"
          />
        </div>

        {status && (
          <div className="text-sm text-center py-2 px-3 bg-green-50 text-green-700 rounded-xl">
            {status}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-4">
        <h2 className="font-semibold text-gray-700">Обновление</h2>
        <p className="text-sm text-gray-500">
          Проверить и установить новую версию приложения.
          Рецепты и меню сохранятся.
        </p>
        <button
          onClick={handleUpdate}
          className="w-full bg-stone-100 hover:bg-stone-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
        >
          Проверить обновления
        </button>
      </div>

      <div className="text-center text-xs text-gray-400 space-y-1">
        <p>Планировщик меню v1.1</p>
        <p>Данные хранятся локально на устройстве</p>
      </div>
    </div>
  )
}
