import type { PassageStatus, EnrichedGroup, EnrichedApparatus } from './api'

export interface StreamUpdatePayload {
  _id: string
  name?: string
  url?: string
  isLive?: boolean
  location?: string
}

export interface ScoreUpdatePayload {
  passageId: string
  score?: number | null
  status?: PassageStatus
  // For new entries
  group?: EnrichedGroup
  apparatus?: EnrichedApparatus
  startTime?: string
  endTime?: string
  location?: string
}

export interface ScheduleUpdatePayload {
  message?: string
}

export type StatusUpdatePayload = ScoreUpdatePayload
