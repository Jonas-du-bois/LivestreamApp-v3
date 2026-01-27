<script setup lang="ts">
import { PublicService } from '../services/public.service'
import type { PassageEnriched } from '../types/api'

const openGroupDetails = inject<(name: string) => void>('openGroupDetails')

const selectedDay = ref<'samedi' | 'dimanche'>('samedi')
const selectedFilter = ref('Tout')
const favorites = ref<Set<string>>(new Set(['4']))

// Fetch data from API using the Service
// Note: For full reactivity with useFetch inside the service, we'd need to pass reactive objects or use refresh with new params.
// For this example, we fetch once.
const { data: scheduleResponse, refresh } = await PublicService.getSchedule({
  day: selectedDay.value,
  apparatus: selectedFilter.value !== 'Tout' ? selectedFilter.value : undefined
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
  return ['Tout', 'Sol', 'Barres', 'Poutre', 'Saut']
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
  if (favorites.value.has(id)) {
    favorites.value.delete(id)
  } else {
    favorites.value.add(id)
  }
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
    <div class="glass-card p-1 flex">
      <button
        @click="selectedDay = 'samedi'"
        class="flex-1 py-2.5 rounded-xl transition-all font-medium"
        :class="selectedDay === 'samedi' 
          ? 'bg-white/20 text-white' 
          : 'text-white/60'"
      >
        Samedi
      </button>
      <button
        @click="selectedDay = 'dimanche'"
        class="flex-1 py-2.5 rounded-xl transition-all font-medium"
        :class="selectedDay === 'dimanche' 
          ? 'bg-white/20 text-white' 
          : 'text-white/60'"
      >
        Dimanche
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
        class="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-white/15 active:scale-[0.98] transition-all"
        @click="handleGroupClick(item.group.name)"
      >
        <div class="text-center min-w-[60px]">
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
            class="p-2 hover:bg-white/10 rounded-lg transition-colors"
            @click="handleInfoClick(item.group.name, $event)"
          >
            <Icon name="fluent:info-24-regular" class="w-5 h-5 text-white/60" />
          </button>
          <button 
            @click="item._id && toggleFavorite(item._id, $event)"
            class="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Icon 
              :name="(item._id && favorites.has(item._id)) ? 'fluent:heart-24-filled' : 'fluent:heart-24-regular'"
              class="w-5 h-5"
              :class="(item._id && favorites.has(item._id)) ? 'text-red-400' : 'text-white/60'"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
