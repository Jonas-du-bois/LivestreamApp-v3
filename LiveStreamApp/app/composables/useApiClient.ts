import { getCurrentInstance, ref } from 'vue'

// Helper to get auth token from cookie
const getAuthToken = (): string | null => {
  // Try useCookie first (works in Vue context)
  try {
    const cookieRef = useCookie('auth_token')
    if (cookieRef.value) {
      return cookieRef.value
    }
  } catch {
    // useCookie might fail outside Vue context
  }
  
  // Fallback: read directly from document.cookie (client-side only)
  if (import.meta.client && typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]*)/)
    if (match) {
      return decodeURIComponent(match[1])
    }
  }
  
  return null
}

// Helper to inject auth header
const getAuthHeaders = (headers: any = {}) => {
  const token = getAuthToken()
  if (token) {
    return {
      ...headers,
      Authorization: `Bearer ${token}`
    }
  }
  return headers
}

export const apiClient = <T>(url: string, options: any = {}) => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string

  return $fetch<T>(url, {
    baseURL: apiBase,
    ...options,
    headers: getAuthHeaders(options.headers)
  })
}

export const useApiClient = <T>(
  url: string,
  options: any = {}
) => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string

  // Inject Headers
  options.headers = getAuthHeaders(options.headers)

  // If the component is already mounted (client-side calls after mount), use $fetch
  const vm = getCurrentInstance?.()
  if (vm && (vm as any).isMounted) {
    const data = ref<T | null>(null)
    const pending = ref(false)
    const error = ref<any>(null)

    const refresh = async () => {
      pending.value = true
      error.value = null
      try {
        const res = await $fetch<T>(url, { baseURL: apiBase, ...options })
        data.value = res
        return res
      } catch (err: any) {
        error.value = err
        console.error('API Error:', err)
        throw err
      } finally {
        pending.value = false
      }
    }

    // Trigger initial fetch
    void refresh()

    return {
      data,
      pending,
      error,
      refresh
    }
  }

  return useFetch<T>(url, {
    baseURL: apiBase,
    ...options,
    onResponseError({ response }) {
      console.error('API Error:', response.status, response._data)
    }
  })
}
