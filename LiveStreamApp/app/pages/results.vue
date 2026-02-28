<script setup lang="ts">
import { PublicService } from '../services/public.service'
import type { PassageEnriched } from '~/types/api'
import type { ScoreUpdatePayload } from '~/types/socket'
import CascadeSkeletonList from '~/components/loading/CascadeSkeletonList.vue'
import ResultCard from '~/components/results/ResultCard.vue'

const { t, locale } = useI18n()
const { translateApparatus, translateCategory } = useTranslatedData()

// Extended type including rank
type PassageResult = PassageEnriched & { rank: number }

const { open: openGroupDetails } = useGroupDetails()

// Active day state
const selectedDay = useState<string>('results-selected-day', () => '')

// Fetch data from API with caching to avoid refetch on tab clicks
const { data: resultsResponse, pending, refresh } = await PublicService.getResults({
  day: selectedDay,
  watch: [locale, selectedDay],
  server: true,
  lazy: false
})

// Manage First Load Skeleton State
const { showSkeleton } = useFirstLoad(pending, resultsResponse)

// Create a local reactive copy that we can mutate properly
const resultsMap = ref<Record<string, PassageResult[]>>({})
const availableDays = computed(() => resultsResponse.value?.meta?.availableDays || [])

// Sync API data to local reactive state
watch(resultsResponse, (newData) => {
  if (newData?.data) {
    // Deep clone to ensure full reactivity
    resultsMap.value = structuredClone(toRaw(newData.data))

    // Initialize selected day if not set
    if (!selectedDay.value && newData.meta?.availableDays?.length) {
      selectedDay.value = newData.meta.availableDays[0]
    }
  }
}, { immediate: true, deep: true })

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

// Get current active section
const activeSection = computed(() => {
  return resultsSections.value.find(s => s.code === activeTab.value)
})

// Get podium (top 3)
const podiumResults = computed(() => {
  if (!activeSection.value) return []
  return activeSection.value.results.slice(0, 3)
})

// Get full ranking (from rank 4 onwards)
const fullRanking = computed(() => {
  if (!activeSection.value) return []
  return activeSection.value.results.slice(3)
})

const handleGroupClick = (groupId: string, apparatusCode?: string) => {
  openGroupDetails(groupId, apparatusCode)
}

const handleScoreUpdate = (data: ScoreUpdatePayload) => {
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

      // Re-sort and re-rank
      updatedList.sort((a, b) => (b.score || 0) - (a.score || 0))
      updatedList.forEach((p, i) => {
        p.rank = i + 1
      })

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
    const code = data.apparatus.code || (data as any).apparatusCode
    
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
      updatedList.sort((a, b) => (b.score || 0) - (a.score || 0))
      updatedList.forEach((p, i) => {
        p.rank = i + 1
      })

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

// Use the new composable for proper socket room management
useSocketRoom(['live-scores', 'schedule-updates'], [
  { event: 'score-update', handler: handleScoreUpdate },
  { event: 'status-update', handler: handleStatusUpdate }
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
        <!-- Day Switcher -->
        <div class=" mb-4">
          <UiDaySwitcher
            v-model="selectedDay"
            :days="availableDays"
          />
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
              :loading="pending"
              icon="fluent:arrow-sync-24-regular"
              @click="refresh()"
            >
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
            class="mt-6 space-y-6"
            role="tabpanel"
            :id="'panel-' + activeSection.code"
            :aria-labelledby="'tab-' + activeSection.code"
          >
            <!-- Podium Section -->
            <div v-if="podiumResults.length > 0">
              <UiSectionTitle tag="h2" size="xl" class="mb-4">{{ t('results.podium') }}</UiSectionTitle>
              <TransitionGroup name="list" tag="div" class="flex flex-col gap-3 relative">
                <ResultCard
                  v-for="result in podiumResults"
                  :key="result._id"
                  :passage="result"
                  :is-podium="true"
                  @click:group="handleGroupClick(result.group._id, activeSection.code)"
                />
              </TransitionGroup>
            </div>

            <!-- Full Ranking Section -->
            <div v-if="fullRanking.length > 0">
              <UiSectionTitle tag="h2" size="xl" class="mb-4">{{ t('results.fullRanking') }}</UiSectionTitle>
              <TransitionGroup name="list" tag="div" class="flex flex-col gap-3 relative">
                <ResultCard
                  v-for="result in fullRanking"
                  :key="result._id"
                  :passage="result"
                  :is-podium="false"
                  @click:group="handleGroupClick(result.group._id, activeSection.code)"
                />
              </TransitionGroup>
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
