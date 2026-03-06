import type { Ref } from 'vue'

/**
 * Gère l'état "premier chargement" (skeleton).
 * Empêche le skeleton de réapparaître lors des refresh en arrière-plan.
 */
export const useFirstLoad = (loading: Ref<boolean>, data: Ref<any>) => {
  const hasLoadedOnce = ref(false)

  // Passe à true dès le premier fetch réussi
  watch([loading, data], ([isPending, val]) => {
    if (!isPending && val) {
      hasLoadedOnce.value = true
    }
  }, { immediate: true })

  // Affiche le skeleton uniquement lors du tout premier chargement
  const showSkeleton = computed(() => loading.value && !hasLoadedOnce.value)

  return {
    hasLoadedOnce,
    showSkeleton
  }
}
