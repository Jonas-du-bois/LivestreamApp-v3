import { type Ref } from 'vue'
import type { PassageEnriched, PassageStatus } from '~/types/api'

// Extended interface with pre-calculated timestamps
export interface PassageTimeEnriched extends PassageEnriched {
  _startTime: number
  _endTime: number
  _dayStart: number
}

/**
 * Logique temporelle des passages :
 * - Pré-calcule les timestamps pour éviter des new Date() répétés
 * - Calcule le statut dynamique (LIVE, FINISHED, SCHEDULED) selon l'heure courante
 * - Fournit des listes triées (à venir, passés, en direct)
 * - Gère le compte à rebours vers le prochain événement
 */
export const usePassageTiming = (
  passages: Ref<PassageEnriched[]>
) => {
  const { t } = useI18n()
  const { now: nowTimestamp } = useNow()

  // Pre-allocate dates outside the map loop to avoid allocations on each iteration
  const dStart = new Date()

  // Enrichissement avec timestamps pré-calculés (mémoisé)
  // ⚠️ DEAD CODE : timeEnrichedPassages n'est consommé par aucun composant externe
  const timeEnrichedPassages = computed<PassageTimeEnriched[]>(() => {
    if (!passages.value) return []

    return passages.value.map(p => {
      // p.startTime is likely a Date object or string. Using Date.parse or directly using getTime()
      // Since it could be a Date object or a string, we check type. But `new Date(string)` is slow.
      // Date.parse is faster for strings. If it's a Date, we can just call getTime().
      const startTimestamp = typeof p.startTime === 'string' ? Date.parse(p.startTime) : (p.startTime as any).getTime ? (p.startTime as any).getTime() : new Date(p.startTime).getTime()
      const endTimestamp = typeof p.endTime === 'string' ? Date.parse(p.endTime) : (p.endTime as any).getTime ? (p.endTime as any).getTime() : new Date(p.endTime).getTime()

      dStart.setTime(startTimestamp)
      const dayStart = new Date(dStart.getFullYear(), dStart.getMonth(), dStart.getDate()).getTime()

      return {
        ...p,
        _startTime: startTimestamp,
        _endTime: endTimestamp,
        _dayStart: dayStart
      }
    })
  })

  // Statut dynamique selon l'heure courante (réactif à nowTimestamp)
  const passagesWithDynamicStatus = computed<PassageTimeEnriched[]>(() => {
    const now = nowTimestamp.value

    return timeEnrichedPassages.value.map(p => {
      const computedStatus = computePassageStatus(p._startTime, p._endTime, now, p.status ?? 'SCHEDULED')

      return {
        ...p,
        status: computedStatus as PassageStatus
      }
    })
  })

  const upcomingPassages = computed(() => {
    const now = nowTimestamp.value
    return passagesWithDynamicStatus.value
      .filter(p => p._startTime > now)
      .sort((a, b) => a._startTime - b._startTime)
  })

  const pastPassages = computed(() => {
    const now = nowTimestamp.value
    return passagesWithDynamicStatus.value
      .filter(p => p._startTime <= now)
      .sort((a, b) => b._startTime - a._startTime)
  })

  const livePassages = computed(() => {
    return passagesWithDynamicStatus.value.filter(p => p.status === 'LIVE')
  })

  // Prochain événement et compte à rebours

  const nextEvent = computed(() => {
    return upcomingPassages.value[0] || null
  })

  const timeToNext = computed(() => {
    if (!nextEvent.value) return ''

    const now = nowTimestamp.value
    const target = nextEvent.value._startTime
    const diff = target - now

    if (diff <= 0) return t('favorites.inProgress')

    const totalSeconds = Math.floor(diff / 1000)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60

    if (h === 0 && m === 0) {
      return `${s}s`
    } else if (h === 0) {
      return m < 2 ? `${m}m ${s}s` : `${m}m`
    } else {
      return `${h}h ${m}m`
    }
  })

  return {
    nowTimestamp,
    timeEnrichedPassages,
    passagesWithDynamicStatus,
    upcomingPassages,
    pastPassages,
    livePassages,
    nextEvent,
    timeToNext
  }
}
