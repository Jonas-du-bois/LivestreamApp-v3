export const useAdminAuth = () => {
  const token = useState<string | null>('adminToken', () => null)

  const login = (newToken: string) => {
    token.value = newToken
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
    authHeader
  }
}
