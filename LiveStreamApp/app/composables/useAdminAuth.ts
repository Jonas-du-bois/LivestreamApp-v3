export const useAdminAuth = () => {
  // Use cookie for persistence (24 hours)
  const token = useCookie<string | null>('auth_token', {
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: 'lax',
    path: '/',
    secure: false, // Ensure it works on localhost HTTP
    httpOnly: false // Accessible to JS (needed for client-side API calls if we read it there, though useCookie handles it)
  })

  const login = (newToken: string) => {
    token.value = newToken
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
    authHeader
  }
}
