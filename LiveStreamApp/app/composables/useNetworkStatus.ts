
export type ConnectionStatus = 'online' | 'offline' | 'poor'

export interface NetworkInformation extends EventTarget {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g'
  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void
  removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void
}

export function useNetworkStatus() {
  const status = ref<ConnectionStatus>('online')
  const isOnline = ref(true)

  const getConnection = (): NetworkInformation | null => {
    const nav = navigator as unknown as {
      connection?: NetworkInformation
      mozConnection?: NetworkInformation
      webkitConnection?: NetworkInformation
    }
    return nav.connection || nav.mozConnection || nav.webkitConnection || null
  }

  const updateNetworkStatus = () => {
    if (typeof navigator === 'undefined') return

    if (!navigator.onLine) {
      status.value = 'offline'
      isOnline.value = false
      return
    }

    isOnline.value = true

    // API Network Information (non supportée sur tous les navigateurs, particulièrement iOS/Safari)
    const conn = getConnection()
    
    if (conn) {
      const effectiveType = conn.effectiveType // 'slow-2g', '2g', '3g', or '4g'
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        status.value = 'poor'
      } else {
        status.value = 'online'
      }
    } else {
      status.value = 'online'
    }
  }

  let connectionMonitor: NetworkInformation | null = null

  onMounted(() => {
    if (!import.meta.client) return

    updateNetworkStatus()

    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)

    const conn = getConnection()
    if (conn) {
      conn.addEventListener('change', updateNetworkStatus)
      connectionMonitor = conn
    }
  })

  onUnmounted(() => {
    if (!import.meta.client) return

    window.removeEventListener('online', updateNetworkStatus)
    window.removeEventListener('offline', updateNetworkStatus)

    if (connectionMonitor) {
      connectionMonitor.removeEventListener('change', updateNetworkStatus)
    }
  })

  return {
    status,
    isOnline
  }
}
