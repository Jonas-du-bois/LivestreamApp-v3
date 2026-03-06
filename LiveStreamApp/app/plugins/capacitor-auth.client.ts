/**
 * Plugin client qui initialise :
 * 1. Le token auth depuis le stockage natif (Preferences)
 * 2. Les notifications push natives (FCM via @capacitor/push-notifications)
 * 3. Masque le Splash Screen natif une fois l'app prête
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

  // 3. Masquer le Splash Screen natif (launchAutoHide: false dans capacitor.config.ts)
  //    On attend que Vue ait rendu le premier frame pour éviter un flash blanc
  const { SplashScreen } = await import('@capacitor/splash-screen')
  await nextTick()
  await SplashScreen.hide({ fadeOutDuration: 500 })
  console.log('[Capacitor Auth] Splash screen hidden')
})
