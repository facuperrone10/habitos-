import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// ARTIFACT=1: build de prueba para claude.ai (rutas relativas, sin service worker).
// BASE_PATH: subcarpeta donde se publica (en GitHub Pages = '/<nombre-del-repo>/').
const artifact = process.env.ARTIFACT === '1'
const basePath = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base: artifact ? './' : basePath,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      disable: artifact,
      registerType: 'prompt',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Hábitos',
        short_name: 'Hábitos',
        description: 'Registro diario de acciones y progreso',
        lang: 'es',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6f6f4',
        theme_color: '#f6f6f4',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,woff2}'] },
    }),
  ],
})
