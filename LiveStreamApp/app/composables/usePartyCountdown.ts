import { computed, onMounted, onUnmounted, ref } from 'vue'

/**
 * ⚛️ usePartyCountdown
 * Composable pour gérer le compte à rebours de l'afterparty (9 Mai 2026 22h00).
 * Fournit des compteurs avec secondes ou sans secondes.
 */
export const usePartyCountdown = () => {
  const { t } = useI18n()

  // Date officielle de la fête (9 Mai 2026 à 22h00)
  const PARTY_DATE = new Date('2026-05-09T22:00:00')
  const PARTY_TIMESTAMP = PARTY_DATE.getTime()

  // On utilise un ref indépendant ici pour que le composable soit autonome
  // et qu'il gère son propre setInterval sans dépendre de useNow (qui n'actualise pas forcément à la seconde).
  const now = ref(Date.now())
  let timerInterval: ReturnType<typeof setInterval>

  onMounted(() => {
    // Initialiser immédiatement
    now.value = Date.now()
    // Mettre à jour toutes les secondes
    timerInterval = setInterval(() => {
      now.value = Date.now()
    }, 1000)
  })

  onUnmounted(() => {
    if (timerInterval) {
      clearInterval(timerInterval)
    }
  })

  // Compte à rebours avec secondes (pour afterparty.vue)
  const timeLeftFull = computed(() => {
    const diff = PARTY_TIMESTAMP - now.value

    if (diff <= 0) return t('afterparty.countdownNow')

    const d = Math.floor(diff / (1000 * 60 * 60 * 24))
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const s = Math.floor((diff % (1000 * 60)) / 1000)

    return `${d}j ${h}h ${m}m ${s}s`
  })

  // Compte à rebours sans secondes (pour HomeHeroCarousel.vue)
  const timeLeftShort = computed(() => {
    const diff = PARTY_TIMESTAMP - now.value

    if (diff <= 0) return t('afterparty.countdownNow')

    const d = Math.floor(diff / (1000 * 60 * 60 * 24))
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return `${d}j ${h}h ${m}m`
  })

  return {
    PARTY_DATE,
    timeLeftFull,
    timeLeftShort
  }
}
