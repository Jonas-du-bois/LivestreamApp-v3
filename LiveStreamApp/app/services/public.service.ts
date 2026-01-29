import type { ScheduleResponse, PassageEnriched, Stream } from '../types/api'

export const PublicService = {
  getSchedule(filters?: { day?: string; apparatus?: string | string[]; division?: string | string[]; salle?: string | string[] }) {
    return useApiClient<ScheduleResponse>('/schedule', {
      query: filters
    })
  },

  getResults() {
    return useApiClient<Record<string, (PassageEnriched & { rank: number })[]>>('/results')
  },

  getStreams(filters?: { isLive?: boolean }) {
    return useApiClient<Stream[]>('/streams', {
      query: filters
    })
  },

  getLive() {
    // Returns both live passages and live streams in one call to reduce multiple requests
    return useApiClient<{ passages: PassageEnriched[]; streams: Stream[] }>('/live')
  },

  getWeather() {
    // Returns current temperature for Yverdon-les-Bains (proxy to external weather API)
    return useApiClient<{ temperature: number; raw?: any }>('/weather')
  },

  seedDatabase() {
    return useApiClient<{ success: boolean; summary: any }>('/seed')
  },

  getGroupDetails(groupId: string) {
    return useApiClient<any>(`/groups/${groupId}/details`)
  }
}
