/**
 * Compte à rebours vers l'afterparty (9 Mai 2026, 22h00).
 * Fournit deux variantes : avec secondes (page afterparty) et sans (carousel).
 */
export const usePartyCountdown = () => {
  const { t } = useI18n()

  const PARTY_DATE = new Date('2026-05-09T22:00:00')
  const PARTY_TIMESTAMP = PARTY_DATE.getTime()

  // Timer indépendant de useNow car le countdown nécessite une précision à la seconde
  const now = ref(Date.now())
  let timerInterval: ReturnType<typeof setInterval>

  onMounted(() => {
    now.value = Date.now()
    timerInterval = setInterval(() => {
      now.value = Date.now()
    }, 1000)
  })

  onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval)
  })

  /** Décompose un diff en ms en jours/heures/minutes/secondes */
  const decompose = (diff: number) => ({
    d: Math.floor(diff / (1000 * 60 * 60 * 24)),
    h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    s: Math.floor((diff % (1000 * 60)) / 1000)
  })

  // Avec secondes (pour la page afterparty)
  const timeLeftFull = computed(() => {
    const diff = PARTY_TIMESTAMP - now.value
    if (diff <= 0) return t('afterparty.countdownNow')
    const { d, h, m, s } = decompose(diff)
    return `${d}j ${h}h ${m}m ${s}s`
  })

  // Sans secondes (pour le carousel d'accueil)
  const timeLeftShort = computed(() => {
    const diff = PARTY_TIMESTAMP - now.value
    if (diff <= 0) return t('afterparty.countdownNow')
    const { d, h, m } = decompose(diff)
    return `${d}j ${h}h ${m}m`
  })

  return {
    timeLeftFull,
    timeLeftShort
  }
}
