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

  updateStream(payload: { streamId: string; type?: string; url?: string; isLive?: boolean; currentPassageId?: string | null; name?: string; cameraName?: string; record?: boolean; timeshift?: boolean; }) {
    return apiClient<void>('/admin/stream', {
      method: 'PUT',
      body: payload
    })
  },

  createStream(payload: { name?: string; location?: string; type: 'custom' | 'apivideo'; url?: string }) {
    return apiClient<{ ok: boolean; stream: any }>('/admin/stream', {
      method: 'POST',
      body: payload
    })
  },

  regenerateStream(streamId: string) {
    return apiClient<{ ok: boolean; stream: any }>(`/admin/streams/${streamId}/regenerate`, {
      method: 'POST'
    })
  },

  getStreamMetrics(streamId: string) {
    return apiClient<{ ok: boolean; metrics: { viewers: number } }>(`/admin/streams/${streamId}/metrics`, {
      method: 'GET'
    })
  },

  seedDatabase() {
    return apiClient<{ success: boolean; summary?: any; error?: string }>('/admin/seed', {
      method: 'POST'
    })
  },

  generateFinals(payload: { 
    finalType: 'WITH_HAND' | 'WITHOUT_HAND';
    qualifiersCount: number; 
    startTime: string; 
    intervalMinutes: number; 
    location?: string;
    customOrderGroupIds?: string[];
    replaceExisting?: boolean;
  }) {
    return apiClient<{ success: boolean; message: string; data?: any }>('/admin/finals-generate', {
      method: 'POST',
      body: payload
    })
  },

  migrateRounds() {
    return apiClient<{ success: boolean; message: string }>('/admin/migrate-rounds', {
      method: 'POST'
    })
  },

  getCloudinarySignature(params: { folder?: string; public_id?: string }) {
    const query = new URLSearchParams()
    if (params.folder) query.append('folder', params.folder)
    if (params.public_id) query.append('public_id', params.public_id)
    return apiClient<any>(`/admin/cloudinary/signature?${query.toString()}`, {
      method: 'GET'
    })
  },

  updateGroupLogo(groupId: string, logoUrl: string) {
    return apiClient<{ ok: boolean; logo: string }>(`/admin/groups/${groupId}/logo`, {
      method: 'PUT',
      body: { logoUrl }
    })
  },

  syncExternalScores(dryRun = true) {
    return apiClient<{
      ok: boolean;
      dryRun: boolean;
      feedUrl: string;
      result: {
        rowsWithScore: number;
        updated: number;
        unchanged: number;
        unmatched: number;
        ambiguous: number;
        unmatchedSamples: Array<Record<string, any>>;
        ambiguousSamples: Array<Record<string, any>>;
      };
    }>('/admin/external-scores/sync', {
      method: 'POST',
      body: { dryRun }
    })
  }
}
