/**
 * Abstraction Firebase Analytics.
 * Web/PWA : envoie via le JS SDK (plugin firebase-analytics.client).
 * Natif (Android/iOS) : le SDK natif collecte automatiquement, les appels ici sont ignorés.
 */
export const useAnalytics = () => {
  const nuxtApp = useNuxtApp()

  /** Enregistre un événement Analytics (Web uniquement, noop sur natif) */
  const logEvent = (eventName: string, params?: Record<string, any>) => {
    // $analytics vaut undefined sur natif → noop silencieux
    if (nuxtApp.$analytics) {
      (nuxtApp.$analytics as any).log(eventName, params)
    }
  }

  return { logEvent }
}
