import type { ScheduleResponse, PassageEnriched, Stream } from '../types/api'

export const PublicService = {
  getSchedule(filters?: { day?: string; apparatus?: string }) {
    return useApiClient<ScheduleResponse>('/schedule', {
      query: filters
    })
  },

  getResults() {
    return useApiClient<PassageEnriched[]>('/results')
  },

  getStreams() {
    return useApiClient<Stream[]>('/streams')
  },

  seedDatabase() {
    return useApiClient<{ success: boolean; summary: any }>('/seed')
  }
}
