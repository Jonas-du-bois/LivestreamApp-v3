export const useAdminAuth = () => {
  // Use cookie for persistence (24 hours)
  const token = useCookie<string | null>('auth_token', {
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: 'lax',
    path: '/',
    secure: false, // Ensure it works on localhost HTTP
    httpOnly: false // Accessible to JS (needed for client-side API calls if we read it there, though useCookie handles it)
  })

  const loginError = ref<string | null>(null)
  const isLoggingIn = ref(false)

  const login = async (password: string): Promise<boolean> => {
    loginError.value = null
    isLoggingIn.value = true
    
    try {
      const response = await $fetch<{ success: boolean; token: string }>('/api/admin/login', {
        method: 'POST',
        body: { password }
      })
      
      if (response.success && response.token) {
        token.value = response.token
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

  const logout = () => {
    token.value = null
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
