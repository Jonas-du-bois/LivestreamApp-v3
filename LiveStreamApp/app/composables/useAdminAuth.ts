import { isNativePlatform, getNativeToken, setNativeToken, removeNativeToken } from '~/utils/capacitor'

export const useAdminAuth = () => {
  // Cookie pour le mode Web (24 heures)
  const cookieToken = useCookie<string | null>('auth_token', {
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: 'lax',
    path: '/',
    secure: false,
    httpOnly: false
  })

  // Token réactif hybride : lit depuis le bon stockage selon la plateforme
  const token = computed({
    get: () => {
      if (import.meta.client && isNativePlatform()) {
        return getNativeToken()
      }
      return cookieToken.value
    },
    set: () => {
      // La modification se fait via login/logout (async pour le natif)
    }
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
