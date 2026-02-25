<script setup lang="ts">
import { PublicService } from '../services/public.service'
import { useFavoritesStore } from '../stores/favorites'
import { storeToRefs } from 'pinia'
import CascadeSkeletonList from '~/components/loading/CascadeSkeletonList.vue'
import {
  SCHEDULE_AUTO_REFRESH,
  NOW_REFRESH_INTERVAL,
  STATUS_OVERRIDE_DEFER
} from '~/utils/timings'

const { t, locale } = useI18n()
const { translateApparatus, translateDay } = useTranslatedData()
const { open: openGroupDetails } = useGroupDetails()
const favoritesStore = useFavoritesStore()
const { favorites } = storeToRefs(favoritesStore)

const selectedDay = useState<string>('schedule-selected-day', () => '')
const selectedFilter = useState('schedule-selected-filter', () => '')
const filtersStore = useScheduleFilters()
const nowTimestamp = ref(Date.now())
let nowRefreshTimer: ReturnType<typeof setInterval> | null = null
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

// ─── Realtime status overrides ───────────────────────────────────
// Instead of mutating useFetch's data ref (unreliable), we keep a
// separate reactive overlay that is merged into the computed output.
// This guarantees Vue sees the change regardless of useFetch internals.
const statusOverrides = new Map<string, { status: string; score?: number | null }>()
const statusVersion = ref(0) // bump → forces filteredSchedule recompute

// All known translations of "all" to detect stale locale values
const ALL_LOCALE_VALUES = ['Tout', 'Alli', 'Tutto', '']

/** Check if current selectedFilter represents "all" (any locale or empty) */
const isAllFilter = (value: string) =>
  !value || value === t('common.all') || ALL_LOCALE_VALUES.includes(value)

// Initialize selectedFilter with translated 'all' on mount
onMounted(() => {
  // Always sync filter value to current locale's "all" if it was a stale "all"
  if (isAllFilter(selectedFilter.value)) {
    selectedFilter.value = t('common.all')
  }

  nowRefreshTimer = setInterval(() => {
    nowTimestamp.value = Date.now()
  }, NOW_REFRESH_INTERVAL)

  // PWA fallback: periodic auto-refresh for when socket is down
  autoRefreshTimer = setInterval(() => {
    refresh()
  }, SCHEDULE_AUTO_REFRESH)

  // PWA: refresh when app comes back to foreground
  if (import.meta.client) {
    document.addEventListener('visibilitychange', handleVisibility)
  }
})

onUnmounted(() => {
  if (nowRefreshTimer) { clearInterval(nowRefreshTimer); nowRefreshTimer = null }
  if (autoRefreshTimer) { clearInterval(autoRefreshTimer); autoRefreshTimer = null }
  if (import.meta.client) {
    document.removeEventListener('visibilitychange', handleVisibility)
  }
})

const handleVisibility = () => {
  if (document.visibilityState === 'visible') {
    statusOverrides.clear()
    statusVersion.value++
    refresh()
  }
}

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
      statusOverrides.clear()
      statusVersion.value++
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

// OPTIMIZATION: Pre-parse dates to avoid new Date() calls in the frequent filteredSchedule computation
const parsedScheduleData = computed(() => {
  if (!scheduleResponse.value?.data) return []

  return scheduleResponse.value.data
    .filter((item: any) => item.group && item.apparatus)
    .map((item: any) => {
      // Pre-calculate timestamps for efficient filtering/status checks
      const dStart = new Date(item.startTime)
      const dEnd = new Date(item.endTime)

      // Calculate start of day (local time) for hidePast comparison
      const dayStart = new Date(dStart.getFullYear(), dStart.getMonth(), dStart.getDate()).getTime()

      return {
        ...item,
        _startTime: dStart.getTime(),
        _endTime: dEnd.getTime(),
        _dayStart: dayStart
      }
    })
})

const filteredSchedule = computed(() => {
  // Touch statusVersion to establish reactive dependency on socket overrides
  const _v = statusVersion.value
  // Establish dependency on time for reactive status updates (~2s precision)
  const nowTime = nowTimestamp.value

  // Use pre-parsed data
  const schedule = parsedScheduleData.value
    .map((item: any) => {
      // Merge any socket-received status override on top of API data
      const override = statusOverrides.get(item._id)
      if (override) {
        return {
          ...item,
          status: override.status,
          ...(override.score !== undefined ? { score: override.score } : {})
        }
      }

      // Client-side status calculation for reactivity
      // This overrides stale server status based on start/end times
      // OPTIMIZATION: Use pre-calculated timestamps
      const start = item._startTime
      const end = item._endTime
      let status = item.status

      if (nowTime >= start && nowTime <= end) {
        status = 'LIVE'
      } else if (nowTime > end) {
        status = 'FINISHED'
      } else if (nowTime < start && (status === 'LIVE' || status === 'FINISHED')) {
        // If time says upcoming but server says LIVE/FINISHED (stale), reset it
        status = 'SCHEDULED'
      }

      return {
        ...item,
        status
      }
    })

  if (!filtersStore.value.hidePast) {
    return schedule
  }

  const now = new Date(nowTime)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

  return schedule.filter((item: any) => {
    if (item.status === 'FINISHED') return false

    // OPTIMIZATION: Use pre-calculated timestamps
    if (Number.isNaN(item._startTime) || Number.isNaN(item._endTime)) return true

    if (item._dayStart < todayStart) return false
    if (item._dayStart > todayStart) return true

    return item._endTime >= nowTime
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

// ─── Socket handlers ─────────────────────────────────────────────
// schedule-update: scheduler changed data, no payload → refresh API
const handleScheduleUpdate = () => {
  console.log('[Schedule] schedule-update → refresh')
  statusOverrides.clear()
  statusVersion.value++
  refresh()
}

// status-update: admin set passage LIVE/FINISHED → instant UI update via overlay
let statusDeferTimer: ReturnType<typeof setTimeout> | null = null

const handleStatusUpdate = (payload: { passageId?: string; status?: string; score?: number | null }) => {
  console.log('[Schedule] status-update:', payload)

  if (!payload?.passageId || !payload?.status) {
    refresh()
    return
  }

  // Instant: store override — filteredSchedule recomputes immediately
  statusOverrides.set(payload.passageId, {
    status: payload.status,
    ...(payload.score !== undefined ? { score: payload.score } : {})
  })
  statusVersion.value++

  // Debounced deferred sync: reset timer on each event so that
  // cascading updates (FINISHED + auto-promoted LIVE) are batched
  if (statusDeferTimer) clearTimeout(statusDeferTimer)
  statusDeferTimer = setTimeout(() => {
    statusOverrides.clear()
    statusVersion.value++
    refresh()
    statusDeferTimer = null
  }, STATUS_OVERRIDE_DEFER)
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
    <div class="glass-card p-1 flex overflow-x-auto" role="tablist" :aria-label="t('pages.schedule')">
      <button
        v-for="day in availableDays"
        :key="`${day}-${locale}`"
        @click="selectedDay = day"
        class="flex-1 py-2.5 px-4 rounded-xl transition-all font-medium capitalize whitespace-nowrap focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none hover:-translate-y-0.5 active:scale-95"
        :class="selectedDay === day
          ? 'bg-white/20 text-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120]'
          : 'text-white/60 hover:bg-white/10'"
        type="button"
        role="tab"
        :aria-selected="selectedDay === day"
      >
        {{ translateDay(day) }}
      </button>
    </div>

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
            <div class="p-4 flex items-start gap-4">
              <div class="text-left min-w-[70px] flex-shrink-0 space-y-2">
                <div class="premium-skeleton-line premium-skeleton-shimmer h-6 w-14"></div>
                <div class="premium-skeleton-line premium-skeleton-shimmer h-3 w-12"></div>
              </div>

              <div class="flex-1 min-w-0 pt-0.5 space-y-2">
                <div class="premium-skeleton-line premium-skeleton-shimmer h-5 w-2/3"></div>
                <div class="flex items-center gap-2">
                  <div class="premium-skeleton-pill premium-skeleton-shimmer w-20"></div>
                  <div class="premium-skeleton-pill premium-skeleton-shimmer w-28"></div>
                </div>
              </div>

              <div class="w-8 h-8 rounded-full premium-skeleton-surface premium-skeleton-shimmer flex-shrink-0"></div>
            </div>
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
