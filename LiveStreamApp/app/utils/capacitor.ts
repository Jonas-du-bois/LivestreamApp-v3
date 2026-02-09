import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const TOKEN_KEY = 'auth_token'

/**
 * Détecte si l'app tourne dans Capacitor (Android/iOS) 
 */
export const isNativePlatform = (): boolean => {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

/**
 * Ref réactive qui garde le token en mémoire pour un accès synchrone.
 * Initialisé au démarrage par le plugin `capacitor-auth.client.ts`.
 */
const _tokenRef = ref<string | null>(null)

/** Accès synchrone au token (utilisable dans les headers) */
export const getNativeToken = (): string | null => _tokenRef.value

/** 
 * Charge le token depuis le stockage natif (Preferences) au démarrage.
 * Appelé une seule fois par le plugin client.
 */
export const initNativeToken = async (): Promise<void> => {
  if (!isNativePlatform()) return
  const { value } = await Preferences.get({ key: TOKEN_KEY })
  _tokenRef.value = value
}

/** Sauvegarde le token dans le stockage natif */
export const setNativeToken = async (token: string): Promise<void> => {
  _tokenRef.value = token
  if (isNativePlatform()) {
    await Preferences.set({ key: TOKEN_KEY, value: token })
  }
}

/** Supprime le token du stockage natif */
export const removeNativeToken = async (): Promise<void> => {
  _tokenRef.value = null
  if (isNativePlatform()) {
    await Preferences.remove({ key: TOKEN_KEY })
  }
}
