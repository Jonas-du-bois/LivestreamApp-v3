import { defineStore } from 'pinia'
import { NotificationService } from '../services/notification.service'
import { urlBase64ToUint8Array } from '../utils/webPush'
import { isNativePlatform } from '../utils/capacitor'
import { capacitorStorage } from '../utils/nativeStorage'

export const useFavoritesStore = defineStore('favorites', () => {
  const favorites = ref<string[]>([])
  const endpoint = ref<string | null>(null)

  /**
   * Souscrit aux push notifications selon la plateforme détectée.
   * Double canal : FCM pour le natif (Android/iOS), Web Push API pour le navigateur/PWA.
   * Idempotent : ne fait rien si un endpoint est déjà enregistré.
   */
  async function subscribeForNotifications() {
    if (endpoint.value) return

    if (isNativePlatform()) {
      // Canal natif : enregistrement via Firebase Cloud Messaging
      try {
        const { waitForFcmToken } = await import('../utils/capacitorPush')
        const fcmToken = await waitForFcmToken()
        if (fcmToken) {
          await NotificationService.subscribe(
            { type: 'fcm', endpoint: fcmToken },
            favorites.value
          )
          endpoint.value = fcmToken
          console.log('[Favorites] FCM subscription registered')
        } else {
          console.warn('[Favorites] FCM token unavailable — permission denied or not initialized')
        }
      } catch (err) {
        console.error('[Favorites] FCM subscription failed:', err)
      }
    } else if (typeof Notification !== 'undefined' && Notification.permission !== 'denied') {
      // Canal web : souscription via Service Worker + Web Push API
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const config = useRuntimeConfig()
        const vapidKey = config.public.vapidPublicKey
        if (!vapidKey) return

        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        })

        const subJson = subscription.toJSON()
        if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
          await NotificationService.subscribe(
            {
              type: 'web',
              endpoint: subJson.endpoint,
              keys: { p256dh: subJson.keys.p256dh, auth: subJson.keys.auth }
            },
            favorites.value
          )
          endpoint.value = subJson.endpoint
          console.log('[Favorites] Web Push subscription registered')
        }
      } catch (err) {
        console.error('[Favorites] Web Push subscription failed:', err)
      }
    }
  }

  async function sync() {
    if (endpoint.value) {
      try {
        await NotificationService.syncFavorites(endpoint.value, favorites.value)
      } catch (err) {
        console.error('[Favorites] Sync failed:', err)
      }
    }
  }

  async function toggleFavorite(passageId: string) {
    const isAdding = !favorites.value.includes(passageId)

    if (isAdding) {
      favorites.value.push(passageId)
      // Déclenche la souscription push dès le premier favori ajouté
      await subscribeForNotifications()
    } else {
      favorites.value = favorites.value.filter(id => id !== passageId)
    }

    await sync()
  }

  async function toggleGroupFavorites(passageIds: string[]) {
    const allFavorited = passageIds.every(id => favorites.value.includes(id))

    if (allFavorited) {
      favorites.value = favorites.value.filter(id => !passageIds.includes(id))
    } else {
      passageIds.forEach(id => {
        if (!favorites.value.includes(id)) {
          favorites.value.push(id)
        }
      })
      // Déclenche la souscription push dès le premier favori ajouté
      await subscribeForNotifications()
    }

    await sync()
  }

  function areAllGroupPassagesFavorited(passageIds: string[]): boolean {
    return passageIds.length > 0 && passageIds.every(id => favorites.value.includes(id))
  }

  function isFavorite(passageId: string): boolean {
    return favorites.value.includes(passageId)
  }

  return {
    favorites,
    endpoint,
    toggleFavorite,
    toggleGroupFavorites,
    areAllGroupPassagesFavorited,
    isFavorite
  }
}, {
  // Persistance multi-plateforme : NSUserDefaults / SharedPreferences (natif) ou localStorage (web)
  persist: {
    storage: capacitorStorage as any
  }
})
