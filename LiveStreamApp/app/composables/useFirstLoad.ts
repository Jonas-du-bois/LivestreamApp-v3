import { type Ref, ref, computed, watch } from 'vue'

/**
 * Composable to manage the "First Load" state (Skeleton).
 * Prevents skeleton from reappearing during subsequent background refreshes.
 *
 * @param loading - The loading state (e.g., from useFetch)
 * @param data - The data ref (e.g., from useFetch)
 */
export const useFirstLoad = (loading: Ref<boolean>, data: Ref<any>) => {
  const hasLoadedOnce = ref(false)

  // Mark as loaded once the first successful fetch completes
  watch([loading, data], ([isPending, val]) => {
    if (!isPending && val) {
      hasLoadedOnce.value = true
    }
  }, { immediate: true })

  // Show skeleton only if loading AND never loaded before
  const showSkeleton = computed(() => loading.value && !hasLoadedOnce.value)

  return {
    hasLoadedOnce,
    showSkeleton
  }
}
