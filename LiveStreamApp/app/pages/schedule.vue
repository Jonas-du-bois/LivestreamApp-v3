<script setup lang="ts">
import { PublicService } from '../services/public.service'
import { useFavoritesStore } from '../stores/favorites'
import { storeToRefs } from 'pinia'

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
const { data: scheduleResponse, refresh } = await PublicService.getSchedule(apiParams)

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
        class="flex-1 py-2.5 px-4 rounded-xl transition-all font-medium capitalize whitespace-nowrap focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
        :class="selectedDay === day
          ? 'bg-white/20 text-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120]'
          : 'text-white/60'"
        type="button"
        role="tab"
        :aria-selected="selectedDay === day"
      >
        {{ translateDay(day) }}
      </button>
    </div>

    <!-- Filter Chips -->
    <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scroll-smooth" role="group" :aria-label="t('filters.title')">
      <button
        v-for="filter in filters"
        :key="`${filter.code || filter}-${locale}`"
        @click.stop="selectedFilter = filter.code || filter"
        class="px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
        :class="selectedFilter === (filter.code || filter)
          ? 'bg-cyan-400 text-[#0B1120] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120]'
          : 'glass-card text-white/80'"
        type="button"
        :aria-pressed="selectedFilter === (filter.code || filter)"
      >
        {{ filter.label || filter }}
      </button>
    </div>

    <!-- Schedule List -->
    <div class="space-y-2">
      <div
        v-if="filteredSchedule.length === 0"
        class="glass-card p-6 text-center text-white/70"
      >
        {{ t('common.noResults') }}
      </div>

      <div 
        v-for="item in filteredSchedule"
        :key="item._id || 'unknown'"
        class="glass-card p-4 cursor-pointer hover:bg-white/15 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
        @click="handleGroupClick(item.group._id, item.apparatus.code)"
        role="button"
        tabindex="0"
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
            <ClientOnly>
              <div class="text-cyan-400 font-bold text-xl leading-tight">{{ formatTime(item.startTime) }}</div>
            </ClientOnly>
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
      </div>
    </div>
  </div>
</template>
