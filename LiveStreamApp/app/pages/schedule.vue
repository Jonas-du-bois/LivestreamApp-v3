<script setup lang="ts">
import { PublicService } from '../services/public.service'
import { useFavoritesStore } from '../stores/favorites'
import { storeToRefs } from 'pinia'
import CascadeSkeletonList from '~/components/loading/CascadeSkeletonList.vue'
import {
  SCHEDULE_AUTO_REFRESH,
  NOW_REFRESH_INTERVAL
} from '~/utils/timings'

const { t, locale } = useI18n()
const { translateApparatus, translateDay } = useTranslatedData()
const { open: openGroupDetails } = useGroupDetails()
const favoritesStore = useFavoritesStore()
const { favorites } = storeToRefs(favoritesStore)

const selectedDay = useState<string>('schedule-selected-day', () => '')
const selectedFilter = useState('schedule-selected-filter', () => '')
const filtersStore = useScheduleFilters()

// All known translations of "all" to detect stale locale values
const ALL_LOCALE_VALUES = ['Tout', 'Alli', 'Tutto', '']

/** Check if current selectedFilter represents "all" (any locale or empty) */
const isAllFilter = (value: string) =>
  !value || value === t('common.all') || ALL_LOCALE_VALUES.includes(value)

// 1. Paramètres réactifs (Computed) - Smart Fetching
const apiParams = computed(() => {
  // Résoudre le filtre d'agrès : si c'est "all" (toute locale) ou vide → pas de filtre
  const filterIsAll = isAllFilter(selectedFilter.value)
  const apparatus = filterIsAll
    ? (filtersStore.value.apparatus.length ? filtersStore.value.apparatus.join(',') : undefined)
    : (selectedFilter.value || undefined) // Éviter d'envoyer '' comme valeur de filtre

  return {
    day: selectedDay.value || undefined, // Ne pas envoyer '' comme jour
    apparatus,
    division: filtersStore.value.division.length ? filtersStore.value.division.join(',') : undefined,
    salle: filtersStore.value.salle.length ? filtersStore.value.salle.join(',') : undefined
  }
})

// 2. Appel Réactif (useFetch surveille apiParams)
const { data: scheduleResponse, pending, error: fetchError, refresh } = await PublicService.getSchedule(apiParams)

// ─── Realtime status overrides ───────────────────────────────────
// Instead of mutating useFetch's data ref (unreliable), we keep a
// separate reactive overlay that is merged into the computed output.
// This guarantees Vue sees the change regardless of useFetch internals.
const { version, apply, handleStatusUpdate, handleScheduleUpdate, reset } = useRealtimeStatus(refresh)

// PWA fallback: periodic auto-refresh + foreground refresh
useAutoRefresh(refresh, SCHEDULE_AUTO_REFRESH, () => {
  reset()
  refresh()
})

// Initialize selectedFilter with translated 'all' on mount
onMounted(() => {
  // Always sync filter value to current locale's "all" if it was a stale "all"
  if (isAllFilter(selectedFilter.value)) {
    selectedFilter.value = t('common.all')
  }
})
const { hasLoadedOnce } = useFirstLoad(pending, scheduleResponse)
const isFilterLoading = ref(false)

const apiParamsSignature = computed(() => JSON.stringify(apiParams.value || {}))

watch(apiParamsSignature, (nextValue, previousValue) => {
  if (!previousValue || nextValue === previousValue || !hasLoadedOnce.value) return
  isFilterLoading.value = true
})

// Reset loading on BOTH success and error — prevents infinite skeleton
watch([pending, scheduleResponse, fetchError], ([isPending, response, err]) => {
  if (!isPending) {
    if (response) {
      // Clear overrides: fresh API data supersedes socket patches
      reset()
    }
    // Always reset loading when fetch completes (success or error)
    isFilterLoading.value = false
  }
}, { immediate: true })

// showSkeleton: always show skeleton until first data arrives.
// Critical for SSR→client consistency: with server:false, both SSR and client
// start with hasLoadedOnce=false and data=null, so both render skeleton.
// This prevents hydration mismatches that crash nested <Transition> components.
const showSkeleton = computed(() => isFilterLoading.value || !hasLoadedOnce.value)

// Store initial metadata separately to avoid filter chips reorganization on refetch
const initialMeta = useState<{
  availableApparatus: { code: string; name: string }[]
  availableDays: string[]
  availableCategories: string[]
  availableLocations: string[]
}>('scheduleInitialMeta', () => ({
  availableApparatus: [],
  availableDays: [],
  availableCategories: [],
  availableLocations: []
}))

// Flag to track if initial meta has been set
const metaInitialized = useState('scheduleMetaInitialized', () => false)

// Share metadata globally (for FilterSheet) - only update on first load
const meta = useState('scheduleMeta', () => scheduleResponse.value?.meta || {
  availableApparatus: [],
  availableDays: [],
  availableCategories: [],
  availableLocations: []
})

watchEffect(() => {
  if (scheduleResponse.value?.meta) {
    meta.value = scheduleResponse.value.meta
    
    // Only set initial meta once (first load)
    if (!metaInitialized.value && scheduleResponse.value.meta.availableApparatus?.length) {
      initialMeta.value = {
        availableApparatus: scheduleResponse.value.meta.availableApparatus || [],
        availableDays: scheduleResponse.value.meta.availableDays || [],
        availableCategories: scheduleResponse.value.meta.availableCategories || [],
        availableLocations: scheduleResponse.value.meta.availableLocations || []
      }
      metaInitialized.value = true
    }
    
    // If no day selected, or selected day is no longer in available days → pick the first
    const availDays = meta.value.availableDays
    if (availDays?.length && (!selectedDay.value || !availDays.includes(selectedDay.value))) {
      isFilterLoading.value = true  // flag dès maintenant pour éviter le flash de l'état vide
      selectedDay.value = availDays[0] ?? ''
    }
  }
})

// Dynamic Days - use initial meta to prevent reordering
const availableDays = computed(() => {
  const days = initialMeta.value.availableDays?.length 
    ? initialMeta.value.availableDays 
    : (scheduleResponse.value?.meta?.availableDays || [])
  return days
})

// Filters - use initialMeta to prevent chips from reorganizing on refetch
interface FilterChipItem {
  code: string
  label: string
}

const filters = computed((): FilterChipItem[] => {
  const allItem: FilterChipItem = { code: t('common.all'), label: t('common.all') }
  const apparatus = initialMeta.value.availableApparatus?.length
    ? initialMeta.value.availableApparatus
    : (scheduleResponse.value?.meta?.availableApparatus || [])
  const apparatusFilters: FilterChipItem[] = apparatus.map((a) => ({
    code: a.name, // On utilise le name pour le filtre API (compatibilité)
    label: translateApparatus(a.code, a.name)
  }))
  return [allItem, ...apparatusFilters]
})

// Reset selectedFilter when locale changes (handles ALL locales)
watch(locale, () => {
  if (isAllFilter(selectedFilter.value)) {
    selectedFilter.value = t('common.all')
  }
})

// Use the new composable
const rawPassages = computed(() => (scheduleResponse.value?.data || []).filter((item: any) => item.group && item.apparatus))
const { passagesWithDynamicStatus, nowTimestamp } = usePassageTiming(rawPassages)

const filteredSchedule = computed(() => {
  // Touch statusVersion to establish reactive dependency on socket overrides
  const _v = version.value

  // Use pre-parsed data from composable
  const schedule = passagesWithDynamicStatus.value
    .map((item) => {
      // Merge any socket-received status override on top of time-based status
      return apply(item)
    })

  if (!filtersStore.value.hidePast) {
    return schedule
  }

  const now = nowTimestamp.value
  const d = new Date(now)
  const todayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

  return schedule.filter((item) => {
    if (item.status === 'FINISHED') return false

    // OPTIMIZATION: Use pre-calculated timestamps from composable
    if (Number.isNaN(item._startTime) || Number.isNaN(item._endTime)) return true

    if (item._dayStart < todayStart) return false
    if (item._dayStart > todayStart) return true

    return item._endTime >= now
  })
})

const clearScheduleFilters = () => {
  selectedFilter.value = t('common.all')
  filtersStore.value.division = []
  filtersStore.value.salle = []
  filtersStore.value.apparatus = []
  filtersStore.value.hidePast = false
}

const toggleFavorite = (id: string, event: Event) => {
  event.stopPropagation()
  favoritesStore.toggleFavorite(id)
}

const isFavorite = (passageId: string) => {
  return favorites.value.includes(passageId)
}

const handleGroupClick = (groupId: string, apparatusCode?: string) => {
  openGroupDetails(groupId, apparatusCode)
}

// Use the composable for proper socket room management
useSocketRoom('schedule-updates', [
  { event: 'schedule-update', handler: handleScheduleUpdate },
  { event: 'status-update', handler: handleStatusUpdate }
])
</script>

<template>
  <div class="px-4 space-y-4 pb-6">
    <!-- Day Switcher -->
    <UiDaySwitcher
      v-model="selectedDay"
      :days="availableDays"
    />

    <!-- Filter Chips -->
    <UiFilterChips
      v-model="selectedFilter"
      :items="filters.map(f => ({ id: f.code, label: f.label }))"
      :aria-label="t('filters.title')"
    />

    <!-- Schedule List -->
    <div class="min-h-[50vh]">
      <Transition name="premium-swap" mode="out-in">
        <CascadeSkeletonList
          v-if="showSkeleton"
          key="schedule-skeleton"
          :count="6"
          layout="vertical"
          :aria-label="t('common.loading')"
        >
          <template #default>
            <UiSkeletonCard
              layout="time"
              content="pills"
              action="circle"
              align="start"
            />
          </template>
        </CascadeSkeletonList>

        <div v-else key="schedule-content">
          <Transition name="fade" mode="out-in">
            <UiEmptyState
              v-if="filteredSchedule.length === 0"
              key="empty"
              :title="t('schedule.noPassagesTitle')"
              :description="t('schedule.noPassagesHint')"
              icon="fluent:filter-dismiss-24-regular"
            >
              <template #actions>
                <button
                  class="inline-flex items-center gap-2 rounded-full gradient-cyan-purple px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  type="button"
                  @click="clearScheduleFilters"
                >
                  <Icon name="fluent:arrow-reset-24-regular" class="h-4 w-4" />
                  <span>{{ t('schedule.clearFilters') }}</span>
                </button>
              </template>
            </UiEmptyState>

            <TransitionGroup
              v-else
              name="list"
              tag="div"
              class="flex flex-col gap-2 relative"
              key="list"
            >
              <SchedulePassageCard
                v-for="(item, index) in filteredSchedule"
                :key="item._id || `${item.group?._id || 'g'}-${item.startTime || 's'}-${item.apparatus?.code || 'a'}-${index}`"
                :passage="item"
                :is-favorite="!!(item._id && isFavorite(item._id))"
                @click:group="handleGroupClick"
                @toggle:favorite="(id, event) => toggleFavorite(id, event)"
              />
            </TransitionGroup>
          </Transition>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* Fade Transition for Empty State switch */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.14s ease;
  }
}
</style>
