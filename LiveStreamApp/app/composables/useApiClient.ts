import { isNativePlatform, getNativeToken } from '~/utils/capacitor'

/** Récupère le token d'authentification selon la plateforme */
const getAuthToken = (): string | null => {
  // Capacitor : token stocké en mémoire via Preferences
  if (import.meta.client && isNativePlatform()) {
    return getNativeToken()
  }

  // Web : lecture du cookie
  try {
    const cookieRef = useCookie('auth_token')
    if (cookieRef.value) return cookieRef.value
  } catch {
    // useCookie peut échouer hors contexte Vue (store Pinia, service…)
  }

  // Fallback : lecture directe du cookie côté client
  if (import.meta.client && typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]*)/)
    const tokenValue = match?.[1]
    if (tokenValue) return decodeURIComponent(tokenValue)
  }

  return null
}

/** Injecte le header Authorization si un token est disponible */
const getAuthHeaders = (headers: HeadersInit | Record<string, string> = {}) => {
  const token = getAuthToken()
  if (token) {
    return {
      ...headers,
      Authorization: `Bearer ${token}`
    }
  }
  return headers
}

/** Client $fetch brut avec auth et auto-logout sur 401 */
export const apiClient = <T>(url: string, options: Parameters<typeof $fetch>[1] = {}) => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string

  return $fetch<T>(url, {
    baseURL: apiBase,
    ...options,
    headers: getAuthHeaders(options.headers),
    async onResponseError({ response }) {
      // Session expirée : on supprime le token et on reload
      if (response.status === 401 && import.meta.client) {
        const { isNativePlatform, removeNativeToken } = await import('~/utils/capacitor')
        
        if (isNativePlatform()) {
          await removeNativeToken()
        } else {
          document.cookie = 'auth_token=; path=/; max-age=0'
        }

        if (window.location.pathname.startsWith('/admin')) {
          window.location.reload()
        }
      }
    }
  })
}

/**
 * Client API réactif avec gestion automatique du contexte Vue.
 *
 * - En setup() initial : utilise useFetch (SSR-compatible, hydratation)
 * - Hors setup ou après montage : utilise $fetch directement
 *   pour éviter le warning Nuxt "Component is already mounted"
 */
export const useApiClient = <T>(
  url: string,
  options: Parameters<typeof useFetch>[1] = {}
) => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string

  options.headers = getAuthHeaders(options.headers as HeadersInit | Record<string, string>)

  // Détecte si on est dans un setup() actif et non encore monté
  const vm = getCurrentInstance?.()
  if (!vm || (vm as unknown as { isMounted: boolean }).isMounted) {
    const data = ref<T | null>(null)
    const pending = ref(false)
    const error = ref<Error | null>(null)

    const refresh = async () => {
      pending.value = true
      error.value = null
      try {
        const res = await $fetch<T>(url, { baseURL: apiBase, ...options as any })
        data.value = res
        return res
      } catch (err) {
        error.value = err instanceof Error ? err : new Error(String(err))
        console.error('API Error:', err)
        throw err
      } finally {
        pending.value = false
      }
    }

    // Déclenche le fetch immédiatement
    void refresh()

    return {
      data,
      pending,
      error,
      refresh
    }
  }

  // En setup() : useFetch gère le SSR/hydratation
  return useFetch<T>(url, {
    baseURL: apiBase,
    // SPA/Capacitor (ssr: false) : fetch côté client uniquement
    server: false,
    // Ignore le cache de payload pré-rendu (données vides au build)
    getCachedData: () => undefined,
    ...options,
    onResponseError({ response }) {
      console.error('API Error:', response.status, response._data)
    }
  })
}
