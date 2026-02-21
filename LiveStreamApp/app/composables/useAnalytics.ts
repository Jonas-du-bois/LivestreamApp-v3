/**
 * Composable unifié pour Firebase Analytics.
 *
 * Usage : const analytics = useAnalytics()
 *
 * Sur Web/PWA  → utilise Firebase JS SDK (via le plugin firebase-analytics.client.ts)
 * Sur Android  → Firebase Analytics est collecté nativement automatiquement
 * Sur iOS      → idem Android
 *
 * Les événements appelés ici sont :
 *  - toujours envoyés sur Web (via JS SDK)
 *  - ignorés silencieusement sur natif (le SDK natif gère lui-même)
 */
export const useAnalytics = () => {
  const nuxtApp = useNuxtApp()

  /** Enregistre un événement Firebase Analytics (Web uniquement, natif auto) */
  const logEvent = (eventName: string, params?: Record<string, any>) => {
    // $analytics est fourni par le plugin firebase-analytics.client.ts
    // Il est undefined sur natif → on ignore silencieusement
    if (nuxtApp.$analytics) {
      (nuxtApp.$analytics as any).log(eventName, params)
    }
  }

  /** Identifie l'utilisateur courant dans Firebase */
  const setUserId = (userId: string) => {
    if (nuxtApp.$analytics) {
      (nuxtApp.$analytics as any).setUserId(userId)
    }
  }

  return { logEvent, setUserId }
}
