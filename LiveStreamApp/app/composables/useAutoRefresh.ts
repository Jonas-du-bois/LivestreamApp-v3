import { onMounted, onUnmounted } from 'vue'

/**
 * Composable to handle auto-refreshing data on an interval and when the app becomes visible.
 *
 * @param callback The function to call on the interval.
 * @param intervalMs The interval in milliseconds.
 * @param onVisibility Optional function to call when the app becomes visible. Defaults to `callback`.
 */
export function useAutoRefresh(
  callback: () => void | Promise<void>,
  intervalMs: number,
  onVisibility?: () => void | Promise<void>
) {
  let timer: ReturnType<typeof setInterval> | null = null

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      if (onVisibility) {
        onVisibility()
      } else {
        callback()
      }
    }
  }

  onMounted(() => {
    // Start the interval
    timer = setInterval(() => {
      callback()
    }, intervalMs)

    // Add visibility listener
    if (import.meta.client) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
  })

  onUnmounted(() => {
    // Clear the interval
    if (timer) {
      clearInterval(timer)
      timer = null
    }

    // Remove visibility listener
    if (import.meta.client) {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  })
}
