import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/meal-planner/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
      },
      manifest: {
        name: 'Планировщик меню',
        short_name: 'Меню',
        description: 'Планирование меню на неделю и список покупок',
        theme_color: '#86efac',
        background_color: '#f8faf8',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/meal-planner/',
        start_url: '/meal-planner/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
