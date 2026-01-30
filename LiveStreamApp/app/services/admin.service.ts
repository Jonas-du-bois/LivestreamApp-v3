import type { PassageStatus } from '../types/api'

export const AdminService = {
  updateScore(payload: { passageId: string; score?: number }) {
    const { authHeader } = useAdminAuth()
    const config = useRuntimeConfig()
    return $fetch<{ ok: boolean; payload: any }>('/admin/score', {
      baseURL: config.public.apiBase,
      method: 'PUT',
      body: payload,
      headers: authHeader.value as HeadersInit
    })
  },

  updateStatus(payload: { passageId: string; status: PassageStatus }) {
    const { authHeader } = useAdminAuth()
    const config = useRuntimeConfig()
    return $fetch<void>('/admin/status', {
      baseURL: config.public.apiBase,
      method: 'PUT',
      body: payload,
      headers: authHeader.value as HeadersInit
    })
  },

  updateStream(payload: { streamId: string; type?: string; url?: string; isLive?: boolean; currentPassageId?: string | null }) {
    const { authHeader } = useAdminAuth()
    const config = useRuntimeConfig()
    return $fetch<void>('/admin/stream', {
      baseURL: config.public.apiBase,
      method: 'PUT',
      body: payload,
      headers: authHeader.value as HeadersInit
    })
  }
}
