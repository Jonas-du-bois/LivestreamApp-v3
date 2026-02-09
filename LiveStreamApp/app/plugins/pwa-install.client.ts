// Plugin côté client uniquement pour @khmyznikov/pwa-install
// Désactivé en mode natif (Capacitor) car inutile
import { isNativePlatform } from '~/utils/capacitor'

export default defineNuxtPlugin(async () => {
  // Ne pas charger le web component PWA sur les apps natives
  if (isNativePlatform()) return
  
  // Import dynamique côté client seulement
  await import('@khmyznikov/pwa-install')
})
