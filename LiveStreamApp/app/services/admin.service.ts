import type { PassageStatus, SeedResponse } from '../types/api'
import { apiClient } from '../composables/useApiClient'

export const AdminService = {
  login(password: string) {
    return apiClient<{ success: boolean; token: string }>('/admin/login', {
      method: 'POST',
      body: { password }
    })
  },

  updateScore(payload: { passageId: string; score?: number }) {
    return apiClient<{ ok: boolean; payload: unknown }>('/admin/score', {
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
  },

  seedDatabase() {
    return apiClient<SeedResponse>('/admin/seed', {
      method: 'POST'
    })
  }
}
