import type { PassageEnriched, Stream, EnrichedGroup } from '~/types/api'

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

/**
 * Recherche globale avec debounce sur les données schedule + live.
 * Filtre par nom de groupe, engin, canton et localisation.
 */
export const useGlobalSearch = () => {
  const searchQuery = ref('')
  const isLoading = ref(false)

  const groupResults = ref<EnrichedGroup[]>([])
  const passageResults = ref<PassageEnriched[]>([])
  const liveResults = ref<{ passages: PassageEnriched[]; streams: Stream[] }>({ passages: [], streams: [] })

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  /** Vide tous les résultats (utilisé à la réinit et quand la recherche est trop courte) */
  const clearResults = () => {
    groupResults.value = []
    passageResults.value = []
    liveResults.value = { passages: [], streams: [] }
  }

  const resetSearch = () => {
    searchQuery.value = ''
    clearResults()
    isLoading.value = false
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  const performSearch = async (query: string) => {
    const q = query.trim().toLowerCase()

    if (q.length < MIN_QUERY_LENGTH) {
      clearResults()
      return
    }

    isLoading.value = true

    try {
      const [scheduleData, liveData] = await Promise.all([
        apiClient<{ data: PassageEnriched[] }>('/schedule'),
        apiClient<{ passages: PassageEnriched[]; streams: Stream[] }>('/live')
      ])

      // Filtre les passages dont le groupe, l'engin ou le canton correspond
      const matchingPassages = (scheduleData.data ?? []).filter((p) => {
        const groupName = p.group?.name?.toLowerCase() ?? ''
        const apparatus = p.apparatus?.name?.toLowerCase() ?? ''
        const canton = p.group?.canton?.toLowerCase() ?? ''
        return groupName.includes(q) || apparatus.includes(q) || canton.includes(q)
      })

      // Dédoublonne les groupes à partir des passages trouvés
      const seenIds = new Set<string>()
      const groups: EnrichedGroup[] = []
      for (const p of matchingPassages) {
        if (p.group?._id && !seenIds.has(p.group._id)) {
          seenIds.add(p.group._id)
          groups.push(p.group)
        }
      }

      groupResults.value = groups
      passageResults.value = matchingPassages

      // Filtre les résultats live (passages en cours + flux vidéo)
      const livePassages = (liveData.passages ?? []).filter((p) => {
        const groupName = p.group?.name?.toLowerCase() ?? ''
        const apparatus = p.apparatus?.name?.toLowerCase() ?? ''
        return groupName.includes(q) || apparatus.includes(q)
      })

      const liveStreams = (liveData.streams ?? []).filter((s) => {
        const name = s.name?.toLowerCase() ?? ''
        const location = s.location?.toLowerCase() ?? ''
        return name.includes(q) || location.includes(q)
      })

      liveResults.value = { passages: livePassages, streams: liveStreams }
    } catch {
      clearResults()
    } finally {
      isLoading.value = false
    }
  }

  watch(searchQuery, (value) => {
    if (debounceTimer) clearTimeout(debounceTimer)

    if (value.trim().length < MIN_QUERY_LENGTH) {
      clearResults()
      isLoading.value = false
      return
    }

    isLoading.value = true
    debounceTimer = setTimeout(() => {
      performSearch(value)
    }, DEBOUNCE_MS)
  })

  return {
    searchQuery,
    isLoading,
    groupResults,
    passageResults,
    liveResults,
    resetSearch
  }
}
