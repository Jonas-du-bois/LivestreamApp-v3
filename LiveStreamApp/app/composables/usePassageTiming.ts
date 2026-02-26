import { computed, type Ref } from 'vue'
import type { PassageEnriched, PassageStatus } from '~/types/api'

// Extended interface with pre-calculated timestamps
export interface PassageTimeEnriched extends PassageEnriched {
  _startTime: number
  _endTime: number
  _dayStart: number
}

/**
 * Composable for handling time-based logic for passages.
 * - Pre-calculates timestamps for performance.
 * - Computes dynamic status (LIVE, FINISHED, SCHEDULED) based on current time.
 * - Provides sorted lists (upcoming, past, live).
 * - Handles countdown to next event.
 */
export const usePassageTiming = (
  passages: Ref<PassageEnriched[]>
) => {
  const { t } = useI18n()
  // Reactive current timestamp
  const { now: nowTimestamp } = useNow()

  // 1. Enrich passages with timestamps (Memoized)
  // This avoids calling new Date() repeatedly in frequent re-renders
  const timeEnrichedPassages = computed<PassageTimeEnriched[]>(() => {
    if (!passages.value) return []

    return passages.value.map(p => {
      const dStart = new Date(p.startTime)
      const dEnd = new Date(p.endTime)
      // Calculate start of day (local time) for day comparison
      const dayStart = new Date(dStart.getFullYear(), dStart.getMonth(), dStart.getDate()).getTime()

      return {
        ...p,
        _startTime: dStart.getTime(),
        _endTime: dEnd.getTime(),
        _dayStart: dayStart
      }
    })
  })

  // 2. Compute dynamic status based on time
  // This is reactive to `nowTimestamp`
  const passagesWithDynamicStatus = computed<PassageTimeEnriched[]>(() => {
    const now = nowTimestamp.value.getTime()

    return timeEnrichedPassages.value.map(p => {
      let status: PassageStatus | 'LIVE' = p.status

      // Logic from schedule.vue:
      // Client-side status calculation overrides stale server status based on time
      if (now >= p._startTime && now <= p._endTime) {
        status = 'LIVE'
      } else if (now > p._endTime) {
        status = 'FINISHED'
      } else if (now < p._startTime && (status === 'LIVE' || status === 'FINISHED')) {
        // If time says upcoming but server says LIVE/FINISHED (stale), reset it
        status = 'SCHEDULED'
      }

      return {
        ...p,
        status: status as PassageStatus // cast back to PassageStatus
      }
    })
  })

  // 3. Sorted Lists

  const upcomingPassages = computed(() => {
    const now = nowTimestamp.value.getTime()
    return passagesWithDynamicStatus.value
      .filter(p => p._startTime > now)
      .sort((a, b) => a._startTime - b._startTime)
  })

  const pastPassages = computed(() => {
    const now = nowTimestamp.value.getTime()
    return passagesWithDynamicStatus.value
      .filter(p => p._startTime <= now)
      .sort((a, b) => b._startTime - a._startTime) // Most recent first
  })

  const livePassages = computed(() => {
    return passagesWithDynamicStatus.value.filter(p => p.status === 'LIVE')
  })

  // 4. Next Event & Countdown

  const nextEvent = computed(() => {
    // first element of sorted upcoming
    return upcomingPassages.value[0] || null
  })

  const timeToNext = computed(() => {
    if (!nextEvent.value) return ''

    const now = nowTimestamp.value.getTime()
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
