import { isNativePlatform, getNativeToken, setNativeToken, removeNativeToken } from '~/utils/capacitor'

/**
 * Gestion de l'authentification admin.
 * Web : stockage via cookie HTTP (24h).
 * Mobile (Capacitor) : stockage via Preferences natif.
 */
export const useAdminAuth = () => {
  const cookieToken = useCookie<string | null>('auth_token', {
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
    path: '/',
    secure: false,
    httpOnly: false
  })

  // Lecture hybride : Preferences (natif) ou cookie (web)
  const token = computed({
    get: () => {
      if (import.meta.client && isNativePlatform()) {
        return getNativeToken()
      }
      return cookieToken.value
    },
    // Le setter est volontairement vide — la modification du token
    // passe par login() / logout() pour gérer l'async natif.
    set: () => {}
  })

  const loginError = ref<string | null>(null)
  const isLoggingIn = ref(false)

  const login = async (password: string): Promise<boolean> => {
    loginError.value = null
    isLoggingIn.value = true
    
    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ success: boolean; token: string }>('/api/admin/login', {
        method: 'POST',
        baseURL: config.public.apiBase as string,
        body: { password }
      })
      
      if (response.success && response.token) {
        // Stockage hybride : Preferences sur mobile, cookie sur web
        if (isNativePlatform()) {
          await setNativeToken(response.token)
        } else {
          cookieToken.value = response.token
        }
        return true
      }
      
      loginError.value = 'Échec de la connexion'
      return false
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.statusCode === 401) {
        loginError.value = 'Mot de passe incorrect'
      } else {
        loginError.value = error.message || 'Erreur de connexion'
      }
      return false
    } finally {
      isLoggingIn.value = false
    }
  }

  const logout = async () => {
    if (isNativePlatform()) {
      await removeNativeToken()
    } else {
      cookieToken.value = null
    }
  }

  const authHeader = computed(() => {
    if (token.value) {
      return { Authorization: `Bearer ${token.value}` }
    }
    return {}
  })

  return {
    token,
    login,
    logout,
    authHeader,
    loginError,
    isLoggingIn
  }
}
