import { isNativePlatform } from '~/utils/capacitor'

export type ConnectionStatus = 'online' | 'offline' | 'poor'

export interface NetworkInformation extends EventTarget {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g'
  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void
  removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void
}

/**
 * Détecte l'état réseau (online / offline / poor) de façon hybride :
 * - Natif (Capacitor) : plugin @capacitor/network, plus fiable en WebView
 * - Web/PWA : API navigator.onLine + Network Information API
 */
export function useNetworkStatus() {
  const status = ref<ConnectionStatus>('online')
  const isOnline = ref(true)

  // Alerte native affichée une seule fois par session pour ne pas spammer
  let nativeAlertShown = false

  const showNativeOfflineAlert = async () => {
    if (nativeAlertShown) return
    nativeAlertShown = true
    try {
      const { Dialog } = await import('@capacitor/dialog')
      await Dialog.alert({
        title: 'Connexion perdue',
        message: 'Tu es hors-ligne. Les résultats en direct et le live ne sont pas disponibles. Reconnecte-toi au réseau pour continuer.',
        buttonTitle: 'OK'
      })
    } catch {
      // Fallback silencieux si Dialog n'est pas disponible
    }
  }

  const getConnection = (): NetworkInformation | null => {
    const nav = navigator as unknown as {
      connection?: NetworkInformation
      mozConnection?: NetworkInformation
      webkitConnection?: NetworkInformation
    }
    return nav.connection || nav.mozConnection || nav.webkitConnection || null
  }

  const updateNetworkStatus = (online: boolean, effectiveType?: string) => {
    if (!online) {
      status.value = 'offline'
      isOnline.value = false
      if (isNativePlatform()) showNativeOfflineAlert()
      return
    }

    isOnline.value = true
    nativeAlertShown = false // Réarmer pour la prochaine déconnexion

    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      status.value = 'poor'
    } else {
      status.value = 'online'
    }
  }

  // --- Canal Web (PWA) ---
  const updateFromBrowserApi = () => {
    if (typeof navigator === 'undefined') return
    const conn = getConnection()
    updateNetworkStatus(navigator.onLine, conn?.effectiveType)
  }

  // Références de nettoyage
  let connectionMonitor: NetworkInformation | null = null
  let nativeNetworkCleanup: (() => Promise<void>) | null = null

  onMounted(async () => {
    if (!import.meta.client) return

    if (isNativePlatform()) {
      // --- Canal NATIF : @capacitor/network ---
      // Fiable même dans une WebView Safari/Chrome (salle de sport, réseau capricieux)
      try {
        const { Network } = await import('@capacitor/network')

        // Statut initial
        const current = await Network.getStatus()
        updateNetworkStatus(current.connected, current.connectionType === 'wifi' || current.connectionType === 'cellular' ? '4g' : undefined)

        // Écoute des changements
        const handle = await Network.addListener('networkStatusChange', (networkStatus) => {
          updateNetworkStatus(networkStatus.connected)
        })

        nativeNetworkCleanup = () => handle.remove()
      } catch (err) {
        console.warn('[Network] Native plugin unavailable, falling back to web API:', err)
        updateFromBrowserApi()
        window.addEventListener('online', updateFromBrowserApi)
        window.addEventListener('offline', updateFromBrowserApi)
      }
      return
    }

    // --- Canal Web/PWA ---
    updateFromBrowserApi()

    window.addEventListener('online', updateFromBrowserApi)
    window.addEventListener('offline', updateFromBrowserApi)

    const conn = getConnection()
    if (conn) {
      conn.addEventListener('change', updateFromBrowserApi)
      connectionMonitor = conn
    }
  })

  onUnmounted(async () => {
    if (!import.meta.client) return

    // Nettoyage natif
    if (nativeNetworkCleanup) {
      await nativeNetworkCleanup()
      return
    }

    // Nettoyage web
    window.removeEventListener('online', updateFromBrowserApi)
    window.removeEventListener('offline', updateFromBrowserApi)

    if (connectionMonitor) {
      connectionMonitor.removeEventListener('change', updateFromBrowserApi)
    }
  })

  return {
    status,
    isOnline
  }
}
