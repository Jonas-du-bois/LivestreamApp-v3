import { isNativePlatform } from './capacitor'

/**
 * Token FCM stocké en mémoire après l'enregistrement natif.
 * Initialisé par `initNativePush()` au démarrage de l'app.
 */
let _fcmToken: string | null = null
let _initCalled = false

/** Retourne le token FCM courant (null si pas encore reçu ou non-natif) */
export const getFcmToken = (): string | null => _fcmToken

/**
 * Initialise les notifications push natives (Android/iOS via FCM).
 * - Ajoute les listeners de registration, erreur, réception et clic.
 * - Demande la permission et enregistre le device.
 *
 * Doit être appelé une seule fois au démarrage (plugin capacitor-auth.client.ts).
 */
export const initNativePush = async (): Promise<void> => {
  if (!isNativePlatform() || _initCalled) return
  _initCalled = true

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    // --- Réception du token FCM après enregistrement ---
    await PushNotifications.addListener('registration', (token) => {
      _fcmToken = token.value
      console.log('[NativePush] FCM token registered (', token.value.substring(0, 12), '...)')
    })

    // --- Erreur d'enregistrement ---
    await PushNotifications.addListener('registrationError', (err) => {
      console.error('[NativePush] Registration error:', err.error)
    })

    // --- Notification reçue au premier plan (app ouverte) ---
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[NativePush] Foreground notification:', notification.title)
      // Les notifications en foreground ne s'affichent pas automatiquement sur iOS.
      // Gérer ici si tu veux un toast/bannière in-app.
    })

    // --- Utilisateur a tapé sur une notification (app en background ou fermée) ---
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const url = action.notification.data?.url
      if (url && typeof window !== 'undefined') {
        window.location.href = url
      }
    })

    // --- Demande de permission puis enregistrement ---
    const permStatus = await PushNotifications.requestPermissions()
    if (permStatus.receive === 'granted') {
      await PushNotifications.register()
    } else {
      console.warn('[NativePush] Permission refusée:', permStatus.receive)
    }
  } catch (err) {
    console.error('[NativePush] init failed:', err)
  }
}

/**
 * Attend que le token FCM soit disponible (max 6 secondes).
 * Utile pour les cas où `register()` est async et que l'utilisateur
 * ajoute un favori juste après le démarrage.
 */
export const waitForFcmToken = (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (_fcmToken) {
      resolve(_fcmToken)
      return
    }
    const start = Date.now()
    const interval = setInterval(() => {
      if (_fcmToken) {
        clearInterval(interval)
        resolve(_fcmToken)
      } else if (Date.now() - start > 6000) {
        clearInterval(interval)
        console.warn('[NativePush] Token not received after 6s')
        resolve(null)
      }
    }, 200)
  })
}
