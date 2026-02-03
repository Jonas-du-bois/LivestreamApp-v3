// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2026-02-02',
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@vite-pwa/nuxt',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxt/icon' 
  ],

  // Configuration Vue pour les custom elements (pwa-install)
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag === 'pwa-install'
    }
  },

  nitro: {
    rollupConfig: {
      external: ['@nuxt/nitro-server/dist/runtime/utils/cache-driver.js']
    },
    // Ignore socket.io routes in the router
    /* routeRules: {
      '/socket.io/**': { proxy: false }
    } */
  },

  // Ignore socket.io paths in Vue Router
  /* router: {
    options: {
      strict: false
    }
  }, */

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
        { name: 'mobile-web-app-capable', content: 'yes' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        // ✅ L'iPhone cherche cette icône spécifiquement :
        { rel: 'apple-touch-icon', href: '/icons/logo_livestreamappv3-192.png' }
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'fade', mode: 'in-out' }
  },

  pwa: {
    registerType: 'autoUpdate',
    strategies: 'injectManifest',
    srcDir: '',
    filename: 'sw.ts',
    manifest: {
      name: 'LiveStreamApp FSG',
      short_name: 'LiveScore', // Important qu'il soit court pour l'écran d'accueil
      theme_color: '#0B1120',
      background_color: '#0B1120',
      start_url: '/?standalone=true', // Permet de toujours démarrer à la racine
      scope: '/',                     // Définit que TOUTES les pages font partie de l'app
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: '/icons/logo_livestreamappv3-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/logo_livestreamappv3-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: '/icons/logo_livestreamappv3-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/logo_livestreamappv3-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],
      screenshots: [
        // Screenshots mobile (narrow) - Ajustés à la taille réelle
        {
          src: '/screenshots/home.png',
          sizes: '1170x2532',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Écran d\'accueil avec scores en direct'
        },
        {
          src: '/screenshots/schedule.png',
          sizes: '1170x2532',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Programme des compétitions'
        },
        {
          src: '/screenshots/stream.png',
          sizes: '1170x2532',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Streaming en direct'
        },
        {
          src: '/screenshots/results.png',
          sizes: '1170x2532',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Résultats et classements'
        },
        // Screenshots desktop (wide) - Pour l'interface enrichie sur PC
        {
          src: '/screenshots/home.png',
          sizes: '1170x2532',
          type: 'image/png',
          form_factor: 'wide',
          label: 'Écran d\'accueil avec scores en direct'
        },
        {
          src: '/screenshots/schedule.png',
          sizes: '1170x2532',
          type: 'image/png',
          form_factor: 'wide',
          label: 'Programme des compétitions'
        }
      ]
    },
    injectManifest: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      type: 'module',
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

  devtools: { enabled: false }
})