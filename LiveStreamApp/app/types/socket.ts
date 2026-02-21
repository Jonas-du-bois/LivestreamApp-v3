import type { PassageStatus } from './api'

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
}

export interface ScheduleUpdatePayload {
  message?: string
}
