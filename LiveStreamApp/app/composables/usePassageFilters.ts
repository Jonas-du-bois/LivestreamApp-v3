import { type Ref } from 'vue'
import type { PassageEnriched, PassageStatus } from '~/types/api'
import type { PassageSearchable } from '~/types/ui'

const normalize = (value: string | null | undefined) => (value ?? '').toString().toLowerCase()

/** Enrichit un passage avec des clés de recherche pré-normalisées */
export const enrichPassage = (p: PassageEnriched): PassageSearchable => {
  const groupName = p.group?.name ?? ''
  const apparatusName = p.apparatus?.name ?? ''
  const apparatusCode = p.apparatus?.code ?? ''
  const location = p.location ?? ''
  const category = p.group?.category ?? ''
  
  // Jour fr-FR car le filtrage UI utilise les noms de jours en français
  const dayKey = p.startTime
    ? new Date(p.startTime).toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase()
    : ''

  return {
    ...p,
    score: p.score ?? null,
    _dayKey: dayKey,
    _apparatusCodeKey: normalize(apparatusCode),
    _apparatusNameKey: normalize(apparatusName),
    _groupNameKey: normalize(groupName),
    _locationKey: normalize(location),
    _categoryKey: normalize(category),
    _searchIndex: normalize(`${groupName} ${apparatusName} ${apparatusCode} ${location} ${category}`)
  }
}

export interface PassageFilterOptions {
  searchQuery?: string
  searchCategory?: 'all' | 'group' | 'apparatus' | 'location'
  day?: string
  apparatus?: string
  status?: '' | PassageStatus
  location?: string
  category?: string
  hideFinished?: boolean
  onlyWithScore?: boolean
  onlyWithoutScore?: boolean
}

/**
 * Filtrage multi-critères des passages (jour, engin, statut, texte libre…).
 * Les passages sont enrichis avec des clés normalisées pour des recherches performantes.
 */
export const usePassageFilters = (
  passages: Ref<PassageEnriched[]>,
  options: Ref<PassageFilterOptions>
) => {
  const enrichedPassages = computed(() => passages.value.map(enrichPassage))

  const filteredPassages = computed(() => {
    let result = enrichedPassages.value
    const opts = options.value

    if (opts.day) {
      const dayKey = normalize(opts.day)
      result = result.filter(p => p._dayKey === dayKey)
    }

    if (opts.apparatus) {
      const appKey = normalize(opts.apparatus)
      result = result.filter(p => p._apparatusCodeKey === appKey || p._apparatusNameKey === appKey)
    }

    if (opts.status) {
      result = result.filter(p => p.status === opts.status)
    }

    if (opts.location) {
      const locKey = normalize(opts.location)
      result = result.filter(p => p._locationKey === locKey)
    }
    
    if (opts.category) {
      const catKey = normalize(opts.category)
      result = result.filter(p => p._categoryKey === catKey)
    }

    if (opts.hideFinished) {
      result = result.filter(p => p.status !== 'FINISHED')
    }

    if (opts.onlyWithScore) {
      result = result.filter(p => p.score !== undefined && p.score !== null)
    }

    if (opts.onlyWithoutScore) {
      result = result.filter(p => p.score === undefined || p.score === null)
    }

    const query = normalize((opts.searchQuery || '').trim())
    if (query) {
      const cat = opts.searchCategory || 'all'
      result = result.filter(p => {
        switch (cat) {
          case 'group':
            return p._groupNameKey.includes(query)
          case 'apparatus':
            return p._apparatusNameKey.includes(query) || 
                   p._apparatusCodeKey.includes(query)
          case 'location':
            return p._locationKey.includes(query)
          default:
            return p._searchIndex.includes(query)
        }
      })
    }

    return result
  })

  return {
    enrichedPassages,
    filteredPassages
  }
}
