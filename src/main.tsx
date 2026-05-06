import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA: при каждом запуске проверяем обновления
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((reg) => {
    reg.update()
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing
      if (!newWorker) return
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          window.location.reload()
        }
      })
    })
  })
}
