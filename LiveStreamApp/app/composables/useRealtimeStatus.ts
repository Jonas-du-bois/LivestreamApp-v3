import { ref, type Ref } from 'vue'
import type { PassageStatus } from '~/types/api'
import type { ScoreUpdatePayload, ScheduleUpdatePayload } from '~/types/socket'
import { STATUS_OVERRIDE_DEFER } from '~/utils/timings'

interface OverrideData {
  status: PassageStatus | string
  score?: number | null
}

export function useRealtimeStatus(refreshCallback?: () => void | Promise<void>) {
  const overrides = new Map<string, OverrideData>()
  const version = ref(0)
  let deferTimer: ReturnType<typeof setTimeout> | null = null

  const apply = <T extends { _id?: string; status?: PassageStatus | string; score?: number | null }>(passage: T): T => {
    if (!passage._id) return passage
    const override = overrides.get(passage._id)
    if (override) {
      return {
        ...passage,
        status: override.status,
        ...(override.score !== undefined ? { score: override.score } : {})
      }
    }
    return passage
  }

  const handleStatusUpdate = (payload: ScoreUpdatePayload) => {
    // console.log('[Realtime] status-update:', payload)
    if (payload?.passageId && payload?.status) {
      overrides.set(payload.passageId, {
        status: payload.status,
        ...(payload.score !== undefined ? { score: payload.score } : {})
      })
      version.value++
    }

    if (deferTimer) clearTimeout(deferTimer)
    deferTimer = setTimeout(() => {
      overrides.clear()
      version.value++
      if (refreshCallback) refreshCallback()
      deferTimer = null
    }, STATUS_OVERRIDE_DEFER)
  }

  const handleScoreUpdate = (payload: ScoreUpdatePayload) => {
    // console.log('[Realtime] score-update:', payload)
    if (!payload?.passageId) return

    const existing = overrides.get(payload.passageId)
    overrides.set(payload.passageId, {
      status: payload.status || existing?.status || 'FINISHED',
      score: payload.score ?? existing?.score
    })
    version.value++
  }

  const handleScheduleUpdate = (payload?: ScheduleUpdatePayload) => {
    // console.log('[Realtime] schedule-update → refresh')
    overrides.clear()
    version.value++
    if (refreshCallback) refreshCallback()
  }

  const reset = () => {
    overrides.clear()
    version.value++
    if (deferTimer) {
      clearTimeout(deferTimer)
      deferTimer = null
    }
  }

  return {
    overrides,
    version,
    apply,
    handleStatusUpdate,
    handleScoreUpdate,
    handleScheduleUpdate,
    reset
  }
}
