/**
 * Plugin client qui initialise :
 * 1. Le token auth depuis le stockage natif (Preferences)
 * 2. Les notifications push natives (FCM via @capacitor/push-notifications)
 *
 * Exécuté uniquement sur les plateformes Capacitor (Android/iOS).
 */
export default defineNuxtPlugin(async () => {
  const { isNativePlatform, initNativeToken } = await import('~/utils/capacitor')

  if (!isNativePlatform()) return

  // 1. Charger le token auth depuis Preferences (stockage sécurisé)
  await initNativeToken()
  console.log('[Capacitor Auth] Token loaded from native storage')

  // 2. Initialiser les push notifications natives (FCM)
  const { initNativePush } = await import('~/utils/capacitorPush')
  await initNativePush()
})
