import type { PassageStatus } from '../types/api'
import { apiClient } from '../composables/useApiClient'

export const AdminService = {
  updateScore(payload: { passageId: string; score?: number }) {
    return apiClient<{ ok: boolean; payload: any }>('/admin/score', {
      method: 'PUT',
      body: payload
    })
  },

  updateStatus(payload: { passageId: string; status: PassageStatus }) {
    return apiClient<void>('/admin/status', {
      method: 'PUT',
      body: payload
    })
  },

  updateStream(payload: { streamId: string; type?: string; url?: string; isLive?: boolean; currentPassageId?: string | null }) {
    return apiClient<void>('/admin/stream', {
      method: 'PUT',
      body: payload
    })
  }
}
