/**
 * Adaptateur de stockage hybride pour pinia-plugin-persistedstate.
 *
 * - Sur Capacitor (Android/iOS) : utilise @capacitor/preferences
 *   → données stockées dans NSUserDefaults (iOS) / SharedPreferences (Android)
 *   → plus fiable que le localStorage WebView (non effacé par l'OS)
 * - Sur Web/PWA : utilise localStorage standard
 * - Sur SSR (serveur) : retourne null/no-op pour éviter les erreurs
 */
import { Preferences } from '@capacitor/preferences'
import { isNativePlatform } from './capacitor'

export const capacitorStorage = {
  async getItem(key: string): Promise<string | null> {
    // SSR guard
    if (typeof window === 'undefined') return null

    if (isNativePlatform()) {
      const { value } = await Preferences.get({ key })
      return value
    }
    return localStorage.getItem(key)
  },

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return

    if (isNativePlatform()) {
      await Preferences.set({ key, value })
    } else {
      localStorage.setItem(key, value)
    }
  },

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return

    if (isNativePlatform()) {
      await Preferences.remove({ key })
    } else {
      localStorage.removeItem(key)
    }
  }
}
