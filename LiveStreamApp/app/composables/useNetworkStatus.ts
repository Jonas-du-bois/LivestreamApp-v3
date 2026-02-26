import { ref, onMounted, onUnmounted } from 'vue'

export type ConnectionStatus = 'online' | 'offline' | 'poor'

export function useNetworkStatus() {
  const status = ref<ConnectionStatus>('online')
  const isOnline = ref(true)

  const updateNetworkStatus = () => {
    if (typeof navigator === 'undefined') return

    if (!navigator.onLine) {
      status.value = 'offline'
      isOnline.value = false
      return
    }

    isOnline.value = true

    // API Network Information (non supportée sur tous les navigateurs, particulièrement iOS/Safari)
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
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

  let connectionMonitor: any = null

  onMounted(() => {
    if (typeof window === 'undefined') return

    updateNetworkStatus()

    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)

    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (conn) {
      conn.addEventListener('change', updateNetworkStatus)
      connectionMonitor = conn
    }
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return

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
