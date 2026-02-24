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
  rank?: number
  status?: PassageStatus
  group?: EnrichedGroup
  apparatus?: EnrichedApparatus
  apparatusCode?: string
  startTime?: string
  endTime?: string
  location?: string
}

export interface StatusUpdatePayload {
  passageId: string
  status: PassageStatus
}

export interface ScheduleUpdatePayload {
  message?: string
}
