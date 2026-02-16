import { getCurrentInstance, ref } from 'vue'
import { isNativePlatform, getNativeToken } from '~/utils/capacitor'

// Helper to get auth token (hybrid: native storage on Capacitor, cookie on web)
const getAuthToken = (): string | null => {
  // Mode Capacitor → token stocké dans Preferences (chargé en mémoire au démarrage)
  if (import.meta.client && isNativePlatform()) {
    return getNativeToken()
  }

  // Mode Web → cookie classique
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
    headers: getAuthHeaders(options.headers),
    async onResponseError({ response }) {
      // Auto-logout on 401 (session expirée/invalide)
      if (response.status === 401 && import.meta.client) {
        const { isNativePlatform, removeNativeToken } = await import('~/utils/capacitor')
        
        // Clear token selon la plateforme
        if (isNativePlatform()) {
          await removeNativeToken()
        } else {
          // Clear cookie
          document.cookie = 'auth_token=; path=/; max-age=0'
        }
        
        // Rediriger vers le dashboard (affichera le login)
        if (window.location.pathname.startsWith('/admin')) {
          window.location.reload()
        }
      }
    }
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
    // En mode SPA/Capacitor (ssr: false), forcer le fetch côté client uniquement
    // car les données pré-rendues au build sont vides
    server: false,
    // Ne pas utiliser le cache des payloads pré-rendus (toujours re-fetch)
    getCachedData: () => undefined,
    ...options,
    onResponseError({ response }) {
      console.error('API Error:', response.status, response._data)
    }
  })
}
