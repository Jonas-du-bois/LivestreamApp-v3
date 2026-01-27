<script setup lang="ts">
import { PublicService } from '../services/public.service'
import { useFavoritesStore } from '../stores/favorites'
import { storeToRefs } from 'pinia'

const openGroupDetails = inject<(name: string) => void>('openGroupDetails')
const favoritesStore = useFavoritesStore()
const { favorites } = storeToRefs(favoritesStore)

const selectedDay = ref<string>('samedi')
const selectedFilter = ref('Tout')

// Fetch data from API using the Service
const { data: scheduleResponse, refresh } = await PublicService.getSchedule({
  day: selectedDay.value,
  apparatus: selectedFilter.value !== 'Tout' ? selectedFilter.value : undefined
})

// Share metadata globally (for FilterSheet)
const meta = useState('scheduleMeta', () => scheduleResponse.value?.meta || { availableApparatus: [], availableDays: [] })

watchEffect(() => {
  if (scheduleResponse.value?.meta) {
    meta.value = scheduleResponse.value.meta
  }
})

// Dynamic Days
const availableDays = computed(() => {
  const days = scheduleResponse.value?.meta?.availableDays || []
  // Capitalize days for display
  return days.length > 0 ? days : ['samedi', 'dimanche']
})

// Watcher to refresh data when filters change
watch([selectedDay, selectedFilter], async () => {
  const { data: newData } = await PublicService.getSchedule({
    day: selectedDay.value,
    apparatus: selectedFilter.value !== 'Tout' ? selectedFilter.value : undefined
  })
  scheduleResponse.value = newData.value
})

const filters = computed(() => {
  // Use metadata from API if available, else fallback
  if (scheduleResponse.value?.meta?.availableApparatus) {
     return ['Tout', ...scheduleResponse.value.meta.availableApparatus]
  }
  return ['Tout', 'Sol', 'Barres', 'Reck', 'Saut']
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

const handleGroupClick = (groupName: string) => {
  openGroupDetails?.(groupName)
}

const handleInfoClick = (groupName: string, event: Event) => {
  event.stopPropagation()
  openGroupDetails?.(groupName)
}
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
        class="glass-card p-4 flex items-center gap-2 cursor-pointer hover:bg-white/15 active:scale-[0.98] transition-all"
        @click="handleGroupClick(item.group.name)"
      >
        <div class="text-left min-w-[60px]">
          <div class="text-cyan-400 font-bold text-lg">{{ formatTime(item.startTime) }}</div>
          <div class="text-white/50 text-xs">{{ item.location }}</div>
        </div>

        <div class="flex-1 min-w-0">
          <h4 class="text-white font-bold mb-1">{{ item.group.name }}</h4>
          <div class="flex items-center gap-2 text-sm">
            <!-- Fallback for category since it's not in the API currently -->
            <span class="text-white/60">Groupe</span>
            <span class="text-white/40">•</span>
            <span class="text-purple-400">{{ item.apparatus.name }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button 
            @click="item._id && toggleFavorite(item._id, $event)"
            class="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Icon 
              :name="(item._id && favorites.includes(item._id)) ? 'fluent:heart-24-filled' : 'fluent:heart-24-regular'"
              class="w-5 h-5"
              :class="(item._id && favorites.includes(item._id)) ? 'text-red-400' : 'text-white/60'"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
