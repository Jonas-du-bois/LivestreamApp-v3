// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@vite-pwa/nuxt',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxt/icon' 
  ],

  nitro: {
    rollupConfig: {
      external: ['@nuxt/nitro-server/dist/runtime/utils/cache-driver.js']
    }
  },

  // CSS Global
  css: [
    '~/assets/css/main.css',
    '~/assets/css/transition.css'
  ],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'fade', mode: 'in-out' }
  },

  // Configuration des Icônes (Optionnel mais pratique)
  icon: {
    serverBundle: {
      collections: ['fluent'] 
    }
  },

  // Configuration PWA
  pwa: {
    manifest: {
      name: 'LiveStreamApp FSG',
      short_name: 'LiveStream',
      theme_color: '#0B1120',
      background_color: '#0B1120',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: 'icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    client: {
      installPrompt: true,
    }
  },

  // Variables d'environnement
  runtimeConfig: {
    adminPassword: process.env.NUXT_ADMIN_PASSWORD,
    mongodbUri: process.env.MONGODB_URI,
    vapidPrivateKey: process.env.NUXT_VAPID_PRIVATE_KEY,
    public: {
      apiBase: '/api',
      vapidPublicKey: process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY
    }
  },

  devtools: { enabled: true }
})