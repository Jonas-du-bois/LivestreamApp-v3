import { NOW_REFRESH_INTERVAL } from '~/utils/timings'

/**
 * Fournit un timestamp réactif (now) actualisé à intervalle régulier.
 * Utilisé pour calculer les statuts dynamiques (LIVE, FINISHED, etc.) côté client.
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
