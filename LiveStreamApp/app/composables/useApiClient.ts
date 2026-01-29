import { getCurrentInstance, ref } from 'vue'

export const useApiClient = <T>(
  url: string,
  options: any = {}
) => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string

  // If the component is already mounted (client-side calls after mount), use $fetch
  const vm = getCurrentInstance?.()
  if (vm && (vm as any).isMounted) {
    const nuxt = useNuxtApp()
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
