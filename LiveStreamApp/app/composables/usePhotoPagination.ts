import type { ComputedRef, Ref } from 'vue'

const PAGE_SIZE = 20

/**
 * Pagination côté client pour un tableau réactif.
 * - Affiche les N premiers éléments, charge la page suivante via `loadMore`
 * - Réinitialise si le tableau source se raccourcit (recovery d'erreur)
 */
export function usePhotoPagination<T>(
  items: Ref<T[]> | ComputedRef<T[]>,
  pageSize = PAGE_SIZE
) {
  const page = ref(1)

  watch(items, (next, prev) => {
    if (next.length < (prev?.length ?? 0)) page.value = 1
  })

  const visibleItems = computed(() => items.value.slice(0, page.value * pageSize))
  const hasMore = computed(() => visibleItems.value.length < items.value.length)
  const loadMore = () => { if (hasMore.value) page.value++ }

  return { visibleItems, hasMore, loadMore }
}
