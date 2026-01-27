export const useApiClient = <T>(
  url: string,
  options: any = {}
) => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string

  return useFetch<T>(url, {
    baseURL: apiBase,
    ...options,
    onResponseError({ response }) {
      console.error('API Error:', response.status, response._data)
    }
  })
}
