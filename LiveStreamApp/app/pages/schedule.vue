<script setup lang="ts">
import { PublicService } from '../services/public.service'
import { useFavoritesStore } from '../stores/favorites'
import { storeToRefs } from 'pinia'
import CascadeSkeletonList from '~/components/loading/CascadeSkeletonList.vue'

const { t, locale } = useI18n()
const { translateApparatus, translateDay, formatLocalizedTime } = useTranslatedData()
const openGroupDetails = inject<(groupId: string, apparatusCode?: string) => void>('openGroupDetails')
const favoritesStore = useFavoritesStore()
const { favorites } = storeToRefs(favoritesStore)

const selectedDay = useState<string>('schedule-selected-day', () => '')
const selectedFilter = useState('schedule-selected-filter', () => '')
const filtersStore = useScheduleFilters()
const nowTimestamp = ref(Date.now())
let nowRefreshTimer: ReturnType<typeof setInterval> | null = null

// Initialize selectedFilter with translated 'all' on mount
onMounted(() => {
  if (!selectedFilter.value) {
    selectedFilter.value = t('common.all')
  }

  nowRefreshTimer = window.setInterval(() => {
    nowTimestamp.value = Date.now()
  }, 60_000)
})

onUnmounted(() => {
  if (nowRefreshTimer) {
    clearInterval(nowRefreshTimer)
    nowRefreshTimer = null
  }
})

// 1. Paramètres réactifs (Computed) - Smart Fetching
const apiParams = computed(() => ({
  day: selectedDay.value,
  // On priorise le filtre local "Agrès", sinon on prend ceux du FilterSheet
  apparatus: selectedFilter.value !== t('common.all')
    ? selectedFilter.value
    : (filtersStore.value.apparatus.length ? filtersStore.value.apparatus.join(',') : undefined),
  // Filtres dynamiques provenant du store (FilterSheet)
  division: filtersStore.value.division.length ? filtersStore.value.division.join(',') : undefined,
  salle: filtersStore.value.salle.length ? filtersStore.value.salle.join(',') : undefined
}))

watch(apiParams, (newParams) => {
  console.log('📡 API Params:', newParams)
}, { immediate: true, deep: true })

// 2. Appel Réactif (useFetch surveille apiParams)
const { data: scheduleResponse, pending, refresh } = await PublicService.getSchedule(apiParams)
const hasLoadedOnce = ref(false)
const isFilterLoading = ref(false)

const apiParamsSignature = computed(() => JSON.stringify(apiParams.value || {}))

watch(apiParamsSignature, (nextValue, previousValue) => {
  if (!previousValue || nextValue === previousValue || !hasLoadedOnce.value) return
  isFilterLoading.value = true
})

watch([pending, scheduleResponse], ([isPending, response]) => {
  if (!isPending && response) {
    hasLoadedOnce.value = true
    isFilterLoading.value = false
  }
}, { immediate: true })

const showSkeleton = computed(() => pending.value && (!hasLoadedOnce.value || isFilterLoading.value))

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
      initialMeta.value = { ...scheduleResponse.value.meta }
      metaInitialized.value = true
    }
    
    // If no day selected yet, pick the first available day from meta
    if (!selectedDay.value && meta.value.availableDays?.length) {
      selectedDay.value = meta.value.availableDays[0] ?? ''
    }
  }
})

// Dynamic Days - use initial meta to prevent reordering
const availableDays = computed(() => {
  const days = initialMeta.value.availableDays?.length 
    ? initialMeta.value.availableDays 
    : (scheduleResponse.value?.meta?.availableDays || [])
  return days.length > 0 ? days : ['samedi', 'dimanche']
})

// Filters - use initialMeta to prevent chips from reorganizing on refetch
const filters = computed(() => {
  const apparatus = initialMeta.value.availableApparatus?.length
    ? initialMeta.value.availableApparatus
    : (scheduleResponse.value?.meta?.availableApparatus || [])
  const apparatusFilters = apparatus.map((a: { code: string; name: string }) => ({
    code: a.name, // On utilise le name pour le filtre API (compatibilité)
    label: translateApparatus(a.code, a.name)
  }))
  return [t('common.all'), ...apparatusFilters]
})

// Reset selectedFilter when locale changes (if it was "Tout"/"Alli")
watch(locale, () => {
  // Reset to translated "all" if current filter is the old "all" value
  if (selectedFilter.value === 'Tout' || selectedFilter.value === 'Alli') {
    selectedFilter.value = t('common.all')
  }
})

const filteredSchedule = computed(() => {
  const schedule = scheduleResponse.value?.data || []

  if (!filtersStore.value.hidePast) {
    return schedule
  }

  const now = new Date(nowTimestamp.value)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  return schedule.filter((item) => {
    if (item.status === 'FINISHED') return false

    const startTime = new Date(item.startTime)
    const endTime = new Date(item.endTime)
    const startTimestamp = startTime.getTime()
    const endTimestamp = endTime.getTime()
    if (Number.isNaN(startTimestamp) || Number.isNaN(endTimestamp)) return true

    const passageDayStart = new Date(
      startTime.getFullYear(),
      startTime.getMonth(),
      startTime.getDate()
    )

    if (passageDayStart.getTime() < todayStart.getTime()) return false
    if (passageDayStart.getTime() > todayStart.getTime()) return true

    return endTimestamp >= now.getTime()
  })
})

const clearScheduleFilters = () => {
  selectedFilter.value = t('common.all')
  filtersStore.value.division = []
  filtersStore.value.salle = []
  filtersStore.value.apparatus = []
  filtersStore.value.hidePast = false
}

const formatTime = (isoString: string) => {
  return formatLocalizedTime(isoString)
}

const toggleFavorite = (id: string, event: Event) => {
  event.stopPropagation()
  favoritesStore.toggleFavorite(id)
}

const isFavorite = (passageId: string) => {
  return favorites.value.includes(passageId)
}

const handleGroupClick = (groupId: string, apparatusCode?: string) => {
  openGroupDetails?.(groupId, apparatusCode)
}

// Handle schedule updates
const handleScheduleUpdate = () => {
  refresh()
}

// Handle status updates (when a passage goes LIVE or FINISHED)
const handleStatusUpdate = () => {
  refresh()
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
      :items="filters.map(f => ({ id: f.code || f, label: f.label || f }))"
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
              <UiGlassCard
                v-for="(item, index) in filteredSchedule"
                :key="item._id || `${item.group?._id || 'group'}-${item.startTime || 'start'}-${item.apparatus?.code || 'apparatus'}-${index}`"
                :interactive="true"
                @click="handleGroupClick(item.group._id, item.apparatus.code)"
                @keydown.enter="handleGroupClick(item.group._id, item.apparatus.code)"
                @keydown.space.prevent="handleGroupClick(item.group._id, item.apparatus.code)"
                :aria-label="t('schedule.openGroupDetails', {
                  group: item.group.name,
                  apparatus: translateApparatus(item.apparatus.code, item.apparatus.name),
                  time: formatTime(item.startTime)
                })"
              >
                <div class="flex items-start gap-4">
                  <!-- Time & Location -->
                  <div class="text-left min-w-[70px] flex-shrink-0">
                    <div class="text-cyan-400 font-bold text-xl leading-tight">{{ formatTime(item.startTime) }}</div>
                    <div class="text-white/50 text-xs mt-0.5">{{ item.location }}</div>
                  </div>

                  <!-- Group Info -->
                  <div class="flex-1 min-w-0 pt-0.5">
                    <h4 class="text-white font-bold text-base leading-tight mb-1.5">{{ item.group.name }}</h4>
                    <div class="flex items-center gap-2 text-sm">
                      <span class="text-white/60">{{ t('schedule.group') }}</span>
                      <span class="text-white/40">•</span>
                      <span class="text-purple-400">{{ translateApparatus(item.apparatus.code, item.apparatus.name) }}</span>
                    </div>
                  </div>

                  <!-- Favorite Button -->
                  <div class="flex items-start pt-0.5 flex-shrink-0">
                    <SparkHeart
                      :active="!!(item._id && isFavorite(item._id))"
                      :label="(item._id && isFavorite(item._id)) ? t('schedule.removeFromFavorites', { name: item.group?.name || '' }) : t('schedule.addToFavorites', { name: item.group?.name || '' })"
                      @click.stop="item._id && toggleFavorite(item._id, $event)"
                    />
                  </div>
                </div>
              </UiGlassCard>
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
