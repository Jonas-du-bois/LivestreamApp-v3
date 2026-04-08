/**
 * Gère l'état "premier chargement" (skeleton).
 * Empêche le skeleton de réapparaître lors des refresh en arrière-plan.
 */
export const useFirstLoad = <T>(loading: Ref<boolean>, data: Ref<T | null>) => {
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
