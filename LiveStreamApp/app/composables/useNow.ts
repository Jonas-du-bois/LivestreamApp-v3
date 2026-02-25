import { ref, onMounted, onUnmounted } from 'vue'
import { NOW_REFRESH_INTERVAL } from '~/utils/timings'

/**
 * ⚛️ useNow
 * Shared composable to provide a reactive "now" timestamp.
 * Used for client-side status calculations (LIVE, FINISHED, etc.)
 * with a standardized refresh interval.
 */
export function useNow() {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | null = null

  const update = () => {
    now.value = Date.now()
  }

  onMounted(() => {
    timer = setInterval(update, NOW_REFRESH_INTERVAL)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return {
    now
  }
}
