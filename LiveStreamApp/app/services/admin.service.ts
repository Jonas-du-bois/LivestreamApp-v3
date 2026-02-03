import type { PassageStatus } from '../types/api'
import { apiClient } from '../composables/useApiClient'

export const AdminService = {
  login(password: string) {
    return apiClient<{ success: boolean; token: string }>('/admin/login', {
      method: 'POST',
      body: { password }
    })
  },

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
  },

  seedDatabase() {
    return apiClient<{ success: boolean; summary: any }>('/admin/seed', {
      method: 'POST'
    })
  },

  // Test push notifications
  sendTestPush(payload: { type?: string; title?: string; message?: string; url?: string }) {
    return apiClient<{ 
      success: boolean
      message: string
      sent: number
      failed: number
      total: number
      errors?: string[]
    }>('/admin/test-push', {
      method: 'POST',
      body: payload
    })
  }
}
