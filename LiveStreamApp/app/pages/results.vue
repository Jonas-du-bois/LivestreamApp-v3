<script setup lang="ts">
import { PublicService } from '../services/public.service'
import type { PassageEnriched } from '~/types/api'
import type { ScoreUpdatePayload } from '~/types/socket'
import CascadeSkeletonList from '~/components/loading/CascadeSkeletonList.vue'
import ResultCard from '~/components/results/ResultCard.vue'
import { RESULTS_SOCKET_REFRESH_THROTTLE } from '~/utils/timings'

const { t, locale } = useI18n()
const { translateApparatus, translateCategory } = useTranslatedData()

// Extended type including rank
type PassageResult = PassageEnriched & { rank: number }

const { open: openGroupDetails } = useGroupDetails()

// Active day state
const selectedDay = useState<string>('results-selected-day', () => '')
// Active round state
const selectedRound = useState<'QUALIFIER' | 'FINAL'>('results-selected-round', () => 'QUALIFIER')

// Fetch data from API with caching to avoid refetch on tab clicks
const { data: resultsResponse, pending, refresh } = await PublicService.getResults({
  day: selectedDay,
  round: selectedRound,
  server: true,
  lazy: false
})

// Manage First Load Skeleton State
const { showSkeleton } = useFirstLoad(pending, resultsResponse)

// Create a local reactive copy that we can mutate properly
const resultsMap = ref<Record<string, PassageResult[]>>({})
const availableDays = useState<string[]>('results-available-days', () => [])
const DAY_ALL = 'Tout'

const normalizeDayKey = (day?: string | null) => (day || '').toLowerCase().trim()

const getDayFromStartTime = (startTime?: string) => {
  if (!startTime) return undefined
  const parsed = new Date(startTime)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toLocaleDateString('fr-FR', { weekday: 'long', timeZone: 'Europe/Zurich' })
}

const mergeAvailableDays = (incomingDay?: string) => {
  if (!incomingDay) return false
  const incomingKey = normalizeDayKey(incomingDay)
  if (!incomingKey || incomingKey === normalizeDayKey(DAY_ALL)) return false

  const current = availableDays.value || []
  if (current.some(day => normalizeDayKey(day) === incomingKey)) return false

  const daysWithoutAll = current.filter(day => normalizeDayKey(day) !== normalizeDayKey(DAY_ALL))
  availableDays.value = [DAY_ALL, ...daysWithoutAll, incomingDay]
  return true
}

const shouldApplyLiveUpdateForSelectedDay = (payloadDay?: string) => {
  const selectedKey = normalizeDayKey(selectedDay.value)
  if (!selectedKey || selectedKey === normalizeDayKey(DAY_ALL)) return true
  if (!payloadDay) return true
  return normalizeDayKey(payloadDay) === selectedKey
}

let lastSocketRefreshAt = 0
let refreshTimer: ReturnType<typeof setTimeout> | null = null
const requestResultsRefresh = () => {
  const elapsed = Date.now() - lastSocketRefreshAt
  const waitMs = RESULTS_SOCKET_REFRESH_THROTTLE - elapsed

  if (waitMs <= 0) {
    lastSocketRefreshAt = Date.now()
    void refresh()
    return
  }

  if (refreshTimer) return
  refreshTimer = setTimeout(() => {
    refreshTimer = null
    lastSocketRefreshAt = Date.now()
    void refresh()
  }, waitMs)
}

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
})

// Sync API data to local reactive state
watch(resultsResponse, (newData) => {
  if (newData?.data) {
    // Deep clone to ensure full reactivity safely
    resultsMap.value = JSON.parse(JSON.stringify(newData.data))

    // Initialize selected day if not set, using the activeDay from API
    if (!selectedDay.value && newData.meta?.activeDay) {
      selectedDay.value = newData.meta.activeDay
    }

    // Initialize round if not set or switch to final if available
    if (newData.meta?.activeRound) {
      selectedRound.value = newData.meta.activeRound
    }

    // Persist available days list
    if (newData.meta?.availableDays?.length) {
      availableDays.value = newData.meta.availableDays
    }
  }
}, { immediate: true })

// Active tab state
const activeTab = useState<string | null>('results-active-tab', () => null)

// Computed properties
const resultsSections = computed(() => {
  const map = resultsMap.value
  if (!map) return []

  return Object.keys(map).map(code => {
    const list = map[code] || []
    const first = list[0]
    return {
      code,
      name: translateApparatus(code, first?.apparatus?.name || code),
      icon: first?.apparatus?.icon,
      results: list
    }
  })
})

// Initialize active tab to first section
watch(resultsSections, (sections) => {
  if (sections.length > 0 && !activeTab.value) {
    // Ensure sections[0] is defined before accessing code to avoid "object possibly undefined"
    activeTab.value = sections[0]?.code ?? null
  }
}, { immediate: true })

// Reset to QUALIFIER if switching to Dimanche, as there are no finals on Sunday
watch(selectedDay, (newDay) => {
  if (newDay && newDay.toLowerCase() === 'dimanche' && selectedRound.value === 'FINAL') {
    selectedRound.value = 'QUALIFIER'
  }
})

// Get current active section
const activeSection = computed(() => {
  return resultsSections.value.find(s => s.code === activeTab.value)
})

// Computed grouping by category/subCategory
const categoriesRanking = computed(() => {
  if (!activeSection.value) return []
  
  const catMap = new Map<string, PassageResult[]>()
  activeSection.value.results.forEach(p => {
    const cat = p.group?.subCategory || p.group?.category || 'Sans catégorie'
    if (!catMap.has(cat)) catMap.set(cat, [])
    catMap.get(cat)!.push(p)
  })

  // Convert to array and sort lists by rank
  return Array.from(catMap.entries()).map(([category, list]) => {
    list.sort((a, b) => a.rank - b.rank)
    return {
      category,
      podium: list.slice(0, 3),
      ranking: list.slice(3)
    }
  }).sort((a, b) => a.category.localeCompare(b.category))
})

const handleGroupClick = (groupId: string, apparatusCode?: string) => {
  openGroupDetails(groupId, apparatusCode)
}

const handleScoreUpdate = (data: ScoreUpdatePayload) => {
  // Ignore updates that don't match the currently viewed round
  if (data.round && data.round !== selectedRound.value) return

  const payloadDay = getDayFromStartTime(data.startTime)
  const addedNewDay = mergeAvailableDays(payloadDay)
  if (addedNewDay) {
    requestResultsRefresh()
  }

  if (!shouldApplyLiveUpdateForSelectedDay(payloadDay)) return

  // Data payload: { passageId, score, rank, apparatusCode, ... }
  if (!resultsMap.value) return

  console.log('[results] Received score-update:', data)

  const keys = Object.keys(resultsMap.value)
  let found = false

  for (const key of keys) {
    const list = resultsMap.value[key]
    if (!list) continue
    
    const passageIndex = list.findIndex(p => p._id === data.passageId)

    if (passageIndex !== -1) {
      // Create a new array with updated passage to trigger reactivity
      const updatedList = list.map((p, i) => {
        if (i !== passageIndex) return p
        return {
          ...p,
          score: data.score !== undefined ? data.score : p.score,
          status: data.status || p.status
        }
      })

      // Re-sort and re-rank per category/subCategory
      const catMap = new Map<string, PassageResult[]>()
      updatedList.forEach(p => {
        const cat = p.group?.subCategory || p.group?.category || 'Sans catégorie'
        if (!catMap.has(cat)) catMap.set(cat, [])
        catMap.get(cat)!.push(p)
      })

      updatedList.length = 0 // Clear array
      for (const [cat, list] of catMap.entries()) {
        list.sort((a, b) => (b.score || 0) - (a.score || 0))
        list.forEach((p, i) => {
          p.rank = i + 1
          updatedList.push(p)
        })
      }

      // Trigger reactivity by creating a new object reference
      resultsMap.value = {
        ...resultsMap.value,
        [key]: updatedList
      }

      // Trigger Flash Effect
      nextTick(() => {
        if (import.meta.client) {
          const el = document.getElementById(`result-${data.passageId}`)
          if (el) {
            el.classList.remove('score-flash')
            void el.offsetWidth
            el.classList.add('score-flash')
          }
        }
      })

      found = true
      console.log('[results] Updated passage in', key, '- new score:', data.score)
      break
    }
  }

  // Handle new entry dynamically (e.g. first score for an apparatus)
  if (!found && data.group && data.apparatus) {
    const code = data.apparatus.code || data.apparatusCode
    
    if (code) {
      console.log('[results] Adding new entry for apparatus:', code, 'Score:', data.score)
      
      const existingList = resultsMap.value[code] || []
      const newEntry: PassageResult = {
        _id: data.passageId,
        group: data.group,
        apparatus: data.apparatus,
        score: data.score ?? null,
        rank: 0,
        status: data.status || 'FINISHED',
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        location: data.location
      }

      const updatedList = [...existingList, newEntry]

      // Re-sort and re-rank per category/subCategory
      const catMap = new Map<string, PassageResult[]>()
      updatedList.forEach(p => {
        const cat = p.group?.subCategory || p.group?.category || 'Sans catégorie'
        if (!catMap.has(cat)) catMap.set(cat, [])
        catMap.get(cat)!.push(p)
      })

      updatedList.length = 0 // Clear array
      for (const [cat, list] of catMap.entries()) {
        list.sort((a, b) => (b.score || 0) - (a.score || 0))
        list.forEach((p, i) => {
          p.rank = i + 1
          updatedList.push(p)
        })
      }

      // Trigger reactivity
      resultsMap.value = {
        ...resultsMap.value,
        [code]: updatedList
      }

      // Flash effect for new entry
      nextTick(() => {
        if (import.meta.client) {
          const el = document.getElementById(`result-${data.passageId}`)
          if (el) {
            el.classList.remove('score-flash')
            void el.offsetWidth
            el.classList.add('score-flash')
          }
        }
      })
    }
  }
}

const handleStatusUpdate = (data: ScoreUpdatePayload) => {
  if (data.round && data.round !== selectedRound.value) return
  if (!resultsMap.value) return
  
  const keys = Object.keys(resultsMap.value)
  for (const key of keys) {
    const list = resultsMap.value[key]
    if (!list) continue
    
    const passageIndex = list.findIndex(p => p._id === data.passageId)
    
    if (passageIndex !== -1 && data.status) {
      // Create new array with updated status to trigger reactivity
      const updatedList = list.map((p, i) => {
        if (i !== passageIndex) return p
        return { ...p, status: data.status }
      })
      
      resultsMap.value = {
        ...resultsMap.value,
        [key]: updatedList
      }
      break
    }
  }
}

const handleScheduleUpdate = () => {
  requestResultsRefresh()
}

// Use the new composable for proper socket room management
useSocketRoom(['live-scores', 'schedule-updates'], [
  { event: 'score-update', handler: handleScoreUpdate },
  { event: 'status-update', handler: handleStatusUpdate },
  { event: 'schedule-update', handler: handleScheduleUpdate }
])
</script>

<template>
  <div class="px-4 space-y-6 pb-6">
    <Transition name="premium-swap" mode="out-in">
      <div v-if="showSkeleton" key="results-skeleton" class="px-4 mt-6 space-y-4">
        <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <div v-for="chip in 4" :key="`results-chip-skeleton-${chip}`" class="premium-cascade-item" :style="{ '--cascade-index': String(chip - 1) }">
            <div class="premium-skeleton-pill premium-skeleton-shimmer w-24 h-9 rounded-full"></div>
          </div>
        </div>

        <CascadeSkeletonList :count="6" layout="vertical" :aria-label="t('common.loading')">
          <template #default>
            <UiSkeletonCard
              layout="avatar"
              content="text"
              action="box"
              align="center"
            />
          </template>
        </CascadeSkeletonList>
      </div>

      <div v-else key="results-content">
        <!-- Day & Round Switcher -->
        <div class="space-y-4 mb-4">
          <UiDaySwitcher
            v-model="selectedDay"
            :days="availableDays"
          />

          <!-- Round Selector (only if finals are available and not on Sunday) -->
          <div v-if="(resultsResponse?.meta?.hasFinals || selectedRound === 'FINAL') && selectedDay?.toLowerCase() !== 'dimanche'" class="flex justify-center">
            <div class="glass-card p-1 rounded-full flex gap-1 border border-white/5 bg-white/5">
              <button
                @click="selectedRound = 'QUALIFIER'"
                class="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                :class="selectedRound === 'QUALIFIER' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'"
              >
                Qualifications
              </button>
              <button
                @click="selectedRound = 'FINAL'"
                class="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                :class="selectedRound === 'FINAL' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/20' : 'text-white/40 hover:text-white/60'"
              >
                Finales
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <UiEmptyState
          v-if="!resultsSections.length"
          :title="t('results.noResults')"
          :description="t('results.noResultsHint', 'Les résultats apparaîtront ici dès qu\'ils seront publiés.')"
          icon="fluent:trophy-24-regular"
          :pulse="true"
          class="mx-4 min-h-[300px]"
        >
          <template #actions>
            <UiButton
              variant="secondary"
              rounded="full"
              :disabled="pending"
              class="group"
              @click="refresh()"
            >
              <Icon
                name="fluent:arrow-sync-24-regular"
                class="w-5 h-5 transition-transform duration-200 group-active:rotate-180"
                :class="{ 'animate-spin': pending }"
              />
              {{ t('weather.refresh') }}
            </UiButton>
          </template>
        </UiEmptyState>

        <!-- Tabs Navigation -->
        <UiFilterChips
          v-if="resultsSections.length"
          v-model="activeTab"
          :items="resultsSections.map(s => ({ id: s.code, label: s.name }))"
          :aria-label="t('filters.apparatus')"
          class="mb-6 px-4 overflow-x-auto scrollbar-hide"
        />

        <!-- Content for active tab -->
        <Transition name="premium-swap" mode="out-in">
          <div
            v-if="activeSection"
            :key="activeSection.code"
            class="mt-6 space-y-12 transition-opacity duration-300"
            :class="{ 'opacity-50 grayscale-[0.2]': pending }"
            role="tabpanel"
            :id="'panel-' + activeSection.code"
            :aria-labelledby="'tab-' + activeSection.code"
          >
            <!-- Categories Loop -->
            <div v-for="catData in categoriesRanking" :key="catData.category" class="space-y-6">
              <UiSectionTitle tag="h3" size="lg" class="mb-4 text-purple-300 border-b border-white/10 pb-2">
                {{ translateCategory(catData.category) }}
              </UiSectionTitle>

              <!-- Podium Section -->
              <div v-if="catData.podium.length > 0">
                <UiSectionTitle tag="h4" size="md" class="mb-4">{{ t('results.podium') }}</UiSectionTitle>
                <TransitionGroup name="list" tag="div" class="flex flex-col gap-3 relative">
                  <ResultCard
                    v-for="result in catData.podium"
                    :key="result._id"
                    :passage="result"
                    :is-podium="true"
                    @click:group="handleGroupClick(result.group._id, activeSection.code)"
                  />
                </TransitionGroup>
              </div>

              <!-- Full Ranking Section -->
              <div v-if="catData.ranking.length > 0">
                <UiSectionTitle tag="h4" size="md" class="mb-4">{{ t('results.fullRanking') }}</UiSectionTitle>
                <TransitionGroup name="list" tag="div" class="flex flex-col gap-3 relative">
                  <ResultCard
                    v-for="result in catData.ranking"
                    :key="result._id"
                    :passage="result"
                    :is-podium="false"
                    @click:group="handleGroupClick(result.group._id, activeSection.code)"
                  />
                </TransitionGroup>
              </div>
            </div>

            <!-- No results for this apparatus -->
            <UiEmptyState
              v-if="activeSection.results.length === 0"
              :description="t('results.noApparatusResults')"
              icon="fluent:clipboard-bullet-list-24-regular"
              class="min-h-[200px]"
            />
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
