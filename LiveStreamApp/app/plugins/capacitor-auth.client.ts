/**
 * Plugin client qui initialise le token auth depuis le stockage natif
 * au démarrage de l'app sur Capacitor (Android/iOS).
 */
export default defineNuxtPlugin(async () => {
  const { isNativePlatform, initNativeToken } = await import('~/utils/capacitor')
  
  if (isNativePlatform()) {
    await initNativeToken()
    console.log('[Capacitor Auth] Token loaded from native storage')
  }
})
