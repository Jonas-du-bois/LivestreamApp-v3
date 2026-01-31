<script setup lang="ts">
import { PublicService } from '../services/public.service'
import { useFavoritesStore } from '../stores/favorites'
import { storeToRefs } from 'pinia'

const openGroupDetails = inject<(name: string) => void>('openGroupDetails')
const favoritesStore = useFavoritesStore()
const { favorites } = storeToRefs(favoritesStore)

const selectedDay = useState<string>('schedule-selected-day', () => '')
const selectedFilter = useState('schedule-selected-filter', () => 'Tout')
const filtersStore = useScheduleFilters()

// 1. Paramètres réactifs (Computed) - Smart Fetching
const apiParams = computed(() => ({
  day: selectedDay.value,
  // On priorise le filtre local "Agrès", sinon on prend ceux du FilterSheet
  apparatus: selectedFilter.value !== 'Tout'
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

// Share metadata globally (for FilterSheet)
const meta = useState('scheduleMeta', () => scheduleResponse.value?.meta || {
  availableApparatus: [],
  availableDays: [],
  availableCategories: [],
  availableLocations: []
})

watchEffect(() => {
  if (scheduleResponse.value?.meta) {
    meta.value = scheduleResponse.value.meta
    // If no day selected yet, pick the first available day from meta
    if (!selectedDay.value && meta.value.availableDays?.length) {
      selectedDay.value = meta.value.availableDays[0] ?? ''
    }
  }
})

// Dynamic Days
const availableDays = computed(() => {
  const days = scheduleResponse.value?.meta?.availableDays || []
  // Capitalize days for display
  return days.length > 0 ? days : ['samedi', 'dimanche']
})

const filters = computed(() => {
  // Use metadata from API if available, else fallback
  if (scheduleResponse.value?.meta?.availableApparatus) {
     return ['Tout', ...scheduleResponse.value.meta.availableApparatus]
  }
  return ['Tout', 'Sol', 'Barres', 'Saut']
})

const filteredSchedule = computed(() => {
  // Data is already filtered by the backend via useAsyncData watch
  return scheduleResponse.value?.data || []
})

const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const toggleFavorite = (id: string, event: Event) => {
  event.stopPropagation()
  favoritesStore.toggleFavorite(id)
}

const handleGroupClick = (groupId: string, apparatusCode?: string) => {
  openGroupDetails?.(groupId, apparatusCode)
}

onMounted(() => {
  const socket = useSocket()
  if (socket) {
      socket.on('schedule-update', () => {
          refresh()
      })
  }
})

onUnmounted(() => {
  const socket = useSocket()
  if (socket) {
      socket.off('schedule-update')
  }
})

/* const handleInfoClick = (groupId: string, event: Event) => {
  event.stopPropagation()
  openGroupDetails?.(groupId)
} */
</script>

<template>
  <div class="px-4 space-y-4 pb-6">
    <!-- Day Switcher -->
    <div class="glass-card p-1 flex overflow-x-auto">
      <button
        v-for="day in availableDays"
        :key="day"
        @click="selectedDay = day"
        class="flex-1 py-2.5 px-4 rounded-xl transition-all font-medium capitalize whitespace-nowrap"
        :class="selectedDay === day
          ? 'bg-white/20 text-white' 
          : 'text-white/60'"
      >
        {{ day }}
      </button>
    </div>

    <!-- Filter Chips -->
    <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
      <button
        v-for="filter in filters"
        :key="filter"
        @click="selectedFilter = filter"
        class="px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-all"
        :class="selectedFilter === filter
          ? 'bg-cyan-400 text-[#0B1120]'
          : 'glass-card text-white/80'"
      >
        {{ filter }}
      </button>
    </div>

    <!-- Schedule List -->
    <div class="space-y-2">
      <div 
        v-for="item in filteredSchedule"
        :key="item._id || 'unknown'"
        class="glass-card p-4 cursor-pointer hover:bg-white/15 active:scale-[0.98] transition-all"
        @click="handleGroupClick(item.group._id, item.apparatus.code)"
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
              <span class="text-white/60">Groupe</span>
              <span class="text-white/40">•</span>
              <span class="text-purple-400">{{ item.apparatus.name }}</span>
            </div>
          </div>

          <!-- Favorite Button -->
          <div class="flex items-start pt-0.5 flex-shrink-0">
            <button 
              @click="item.group && toggleFavorite(item.group._id, $event)"
              class="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Icon 
                :name="(item.group && favorites.includes(item.group._id)) ? 'fluent:heart-24-filled' : 'fluent:heart-24-regular'"
                class="w-6 h-6"
                :class="(item.group && favorites.includes(item.group._id)) ? 'text-red-400' : 'text-white/60'"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
