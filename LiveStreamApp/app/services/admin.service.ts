import type { PassageStatus } from '../types/api'

export const AdminService = {
  updateScore(payload: { passageId: string; programScore?: number; techScore?: number; totalScore?: number }) {
    return useApiClient<{ ok: boolean; payload: any }>('/admin/score', {
      method: 'PUT',
      body: payload
    })
  },

  updateStatus(payload: { passageId: string; status: PassageStatus }) {
    return useApiClient<void>('/admin/status', {
      method: 'PUT',
      body: payload
    })
  },

  updateStream(payload: { streamId: string; type?: string; url?: string; isLive?: boolean; currentPassageId?: string | null }) {
    return useApiClient<void>('/admin/stream', {
      method: 'PUT',
      body: payload
    })
  }
}
