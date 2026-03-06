/**
 * Rafraîchit des données à intervalle régulier et quand l'app redevient visible.
 * Gère automatiquement le nettoyage au démontage du composant.
 */
export function useAutoRefresh(
  callback: () => void | Promise<void>,
  intervalMs: number,
  onVisibility?: () => void | Promise<void>
) {
  let timer: ReturnType<typeof setInterval> | null = null

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Permet un callback différent au retour de visibilité (ex: refresh complet vs poll léger)
      onVisibility ? onVisibility() : callback()
    }
  }

  onMounted(() => {
    timer = setInterval(callback, intervalMs)

    if (import.meta.client) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
  })

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }

    if (import.meta.client) {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  })
}
