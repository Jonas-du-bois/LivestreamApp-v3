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

  // Configuration des Icônes (Optionnel mais pratique)
  icon: {
    serverBundle: {
      collections: ['fluent'] 
    }
  },

  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        // ✅ AJOUTS CRUCIAUX POUR IPHONE :
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'LiveScore' },
      ],
      link: [
        // ✅ L'iPhone cherche cette icône spécifiquement :
        { rel: 'apple-touch-icon', href: '/icons/logo_livestreamappv3-192.png' }
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'fade', mode: 'in-out' }
  },

  pwa: {
    registerType: 'autoUpdate',
    strategies: 'generateSW', // Garde ça si tu veux, ou passe en 'injectManifest' si besoin avancé
    manifest: {
      name: 'LiveStreamApp FSG',
      short_name: 'LiveScore', // Important qu'il soit court pour l'écran d'accueil
      theme_color: '#0B1120',
      background_color: '#0B1120',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: '/icons/logo_livestreamappv3-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icons/logo_livestreamappv3-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      // ✅ LA PARTIE MANQUANTE POUR TES ERREURS CONSOLE :
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
          handler: 'NetworkFirst', // Priorité au réseau pour les scores
          options: {
            cacheName: 'api-data',
            networkTimeoutSeconds: 5,
            expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            cacheableResponse: { statuses: [0, 200] }
          }
        },
        {
          // Pour les icônes Nuxt et images externes (YouTube, Twitch)
          urlPattern: ({ url }) => url.pathname.includes('_nuxt_icon') || url.hostname.includes('img.youtube.com') || url.hostname.includes('static-cdn.jtvnw.net'),
          handler: 'StaleWhileRevalidate', // Affiche le cache tout de suite, met à jour en fond
          options: {
            cacheName: 'external-assets',
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 } // 30 jours
          }
        }
      ]
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
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