/**
 * Plugin Firebase Analytics — Web / PWA uniquement.
 * Sur Android/iOS natif, Firebase Analytics est géré nativement
 * par le SDK Android (firebase-analytics) et iOS (FirebaseAnalytics via SPM).
 *
 * Ce plugin :
 * 1. Initialise l'app Firebase avec la config publique
 * 2. Active Google Analytics
 * 3. Trace automatiquement les changements de page (vue router)
 * 4. Expose `$analytics` globalement via useNuxtApp()
 */

import { initializeApp, getApps } from 'firebase/app'
import { getAnalytics, logEvent, isSupported, setUserId as fbSetUserId } from 'firebase/analytics'
import { isNativePlatform } from '~/utils/capacitor'

export default defineNuxtPlugin(async (nuxtApp) => {
  // Analytics web inutile sur une app native (Android/iOS gère nativement)
  if (isNativePlatform()) return

  const config = useRuntimeConfig()

  const {
    firebaseApiKey,
    firebaseAuthDomain,
    firebaseProjectId,
    firebaseMessagingSenderId,
    firebaseAppId,
    firebaseMeasurementId,
  } = config.public

  // Ne pas initialiser si la config Firebase n'est pas renseignée
  if (!firebaseApiKey || !firebaseAppId) {
    console.warn('[Analytics] Firebase config manquante — analytics désactivé')
    return
  }

  // Vérifier que Analytics est supporté par ce navigateur (bloqueurs, Safari ITP...)
  const supported = await isSupported().catch(() => false)
  if (!supported) {
    console.warn('[Analytics] Firebase Analytics non supporté dans ce navigateur')
    return
  }

  // Évite la double initialisation (HMR en dev)
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        apiKey: firebaseApiKey,
        authDomain: firebaseAuthDomain,
        projectId: firebaseProjectId,
        messagingSenderId: firebaseMessagingSenderId,
        appId: firebaseAppId,
        measurementId: firebaseMeasurementId,
      })

  const analytics = getAnalytics(app)
  console.log('[Analytics] Firebase Analytics initialisé')

  // --- Tracking automatique des pages ---
  const router = useRouter()
  router.afterEach((to) => {
    logEvent(analytics, 'page_view', {
      page_path: to.fullPath,
      page_title: to.name?.toString() ?? to.fullPath,
    })
  })

  // --- Expose via useNuxtApp().$analytics ---
  return {
    provide: {
      analytics: {
        /** Enregistre un événement personnalisé */
        log: (eventName: string, params?: Record<string, any>) => {
          logEvent(analytics, eventName, params)
        },
        /** Identifie l'utilisateur connecté (admin) */
        setUserId: (userId: string) => {
          fbSetUserId(analytics, userId)
        },
      },
    },
  }
})
