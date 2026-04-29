// ⚠️ DEAD CODE : Ref n'est pas utilisé dans ce fichier
// import type { Ref } from 'vue'
import type { PassageStatus } from '~/types/api'
import type { ScoreUpdatePayload, ScheduleUpdatePayload } from '~/types/socket'
import { STATUS_OVERRIDE_DEFER } from '~/utils/timings'

interface OverrideData {
  status: PassageStatus | string
  score?: number | null
}

/**
 * Gestion des mises à jour temps réel des passages via socket.
 *
 * Stratégie : les données socket sont stockées comme "overrides" temporaires
 * appliqués par-dessus les données API. Après STATUS_OVERRIDE_DEFER ms,
 * les overrides sont vidés et un refresh API est déclenché pour consolider.
 */
export function useRealtimeStatus(refreshCallback?: () => any) {
  const overrides = new Map<string, OverrideData>()
  const version = ref(0)
  let deferTimer: ReturnType<typeof setTimeout> | null = null

  // Prévient les fuites mémoire si le composant est démonté avant le defer
  onUnmounted(() => {
    if (deferTimer) {
      clearTimeout(deferTimer)
      deferTimer = null
    }
  })

  /** Applique les overrides socket sur un passage donné */
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

  /** Reçoit un changement de statut et programme un refresh différé */
  const handleStatusUpdate = (payload: ScoreUpdatePayload) => {
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

  /** Met à jour le score d'un passage (merge avec l'override existant) */
  const handleScoreUpdate = (payload: ScoreUpdatePayload) => {
    if (!payload?.passageId) return

    const existing = overrides.get(payload.passageId)
    overrides.set(payload.passageId, {
      status: payload.status || existing?.status || 'FINISHED',
      score: payload.score ?? existing?.score
    })
    version.value++
  }

  /** Le planning a changé côté serveur → on purge les overrides et on refresh */
  const handleScheduleUpdate = (_payload?: ScheduleUpdatePayload) => {
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
