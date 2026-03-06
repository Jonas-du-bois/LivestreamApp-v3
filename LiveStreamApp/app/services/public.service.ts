import type { ScheduleResponse, PassageEnriched, Stream, PopulatedStream, GroupDetailsResponse, ResultsResponse, WeatherResponse, SeedResponse } from '../types/api'
import type { UseFetchOptions } from '#app'

export const PublicService = {
  getSchedule(filters?: MaybeRef<{ day?: string; apparatus?: string | string[]; division?: string | string[]; salle?: string | string[]; [key: string]: unknown }>, opts?: { key?: string }) {
    return useApiClient<ScheduleResponse>('/schedule', {
      query: filters,
      key: opts?.key || ('schedule-' + JSON.stringify(toValue(filters) || {}))
    })
  },

  fetchSchedule(filters?: { day?: string; apparatus?: string | string[]; division?: string | string[]; salle?: string | string[]; [key: string]: unknown }) {
    return apiClient<ScheduleResponse>('/schedule', {
      query: filters
    })
  },

  getResults(options: UseFetchOptions<ResultsResponse> & { day?: MaybeRef<string> } = {}) {
    return useApiClient<ResultsResponse>('/results', {
      key: 'results-' + JSON.stringify(toValue(options.day) || 'all'),
      query: computed(() => ({
        day: toValue(options.day) || undefined
      })),
      ...options
    })
  },

  getStreams(filters?: MaybeRef<{ isLive?: boolean; [key: string]: unknown }>) {
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
    return apiClient<WeatherResponse>('/weather')
  },

  getWeather() {
    // Returns current temperature for Yverdon-les-Bains (proxy to external weather API)
    return useApiClient<WeatherResponse>('/weather', {
      key: 'weather'
    })
  },

  seedDatabase() {
    return useApiClient<SeedResponse>('/seed')
  },

  getGroupDetails(groupId: string) {
    return useApiClient<GroupDetailsResponse>(`/groups/${groupId}/details`)
  },

  fetchGroupDetails(groupId: string) {
    return apiClient<GroupDetailsResponse>(`/groups/${groupId}/details`)
  }
}
