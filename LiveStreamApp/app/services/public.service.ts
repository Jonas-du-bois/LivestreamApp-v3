import type { ScheduleResponse, PassageEnriched, Stream, PopulatedStream } from '../types/api'
import { type MaybeRef, toValue } from 'vue'

export const PublicService = {
  getSchedule(filters?: MaybeRef<{ day?: string; apparatus?: string | string[]; division?: string | string[]; salle?: string | string[] }>) {
    return useApiClient<ScheduleResponse>('/schedule', {
      query: filters,
      key: 'schedule-' + JSON.stringify(toValue(filters) || {})
    })
  },

  getResults() {
    return useApiClient<Record<string, (PassageEnriched & { rank: number })[]>>('/results', {
      key: 'results'
    })
  },

  getStreams(filters?: MaybeRef<{ isLive?: boolean }>) {
    return useApiClient<Stream[]>('/streams', {
      query: filters,
      key: 'streams-' + JSON.stringify(toValue(filters) || {}),
      getCachedData: () => undefined // Disable cache for real-time data
    })
  },

  getLive() {
    // Returns both live passages and live streams in one call to reduce multiple requests
    return useApiClient<{ passages: PassageEnriched[]; streams: Stream[] }>('/live', {
      key: 'live',
      getCachedData: () => undefined // Disable cache for real-time data
    })
  },

  fetchLive() {
    return apiClient<{ passages: PassageEnriched[]; streams: Stream[] }>('/live')
  },

  fetchStreams() {
    return apiClient<Stream[]>('/streams')
  },

  fetchStream(id: string) {
    return apiClient<PopulatedStream>(`/streams/${id}`)
  },

  fetchWeather() {
    return apiClient<{ temperature: number; raw?: any }>('/weather')
  },

  getWeather() {
    // Returns current temperature for Yverdon-les-Bains (proxy to external weather API)
    return useApiClient<{ temperature: number; raw?: any }>('/weather', {
      key: 'weather'
    })
  },

  seedDatabase() {
    return useApiClient<{ success: boolean; summary: any }>('/seed')
  },

  getGroupDetails(groupId: string) {
    return useApiClient<any>(`/groups/${groupId}/details`)
  },

  fetchGroupDetails(groupId: string) {
    return apiClient<any>(`/groups/${groupId}/details`)
  }
}
