<script setup lang="ts">
interface ScheduleItem {
  id: string
  time: string
  groupName: string
  category: string
  apparatus: string
  salle: string
  isFavorite?: boolean
}

const openGroupDetails = inject<(name: string) => void>('openGroupDetails')

const selectedDay = ref<'samedi' | 'dimanche'>('samedi')
const selectedFilter = ref('Tout')
const favorites = ref<Set<string>>(new Set(['4']))

const filters = ['Tout', 'Sol', 'Barres', 'Poutre', 'Saut']

const scheduleData: ScheduleItem[] = [
  { id: '1', time: '09:15', groupName: 'FSG Yverdon', category: 'Actifs/Actives', apparatus: 'Sol', salle: 'Salle 1' },
  { id: '2', time: '09:30', groupName: 'FSG Morges', category: 'Mixtes', apparatus: 'Barres', salle: 'Salle 2' },
  { id: '3', time: '09:45', groupName: 'FSG Lausanne', category: 'Actifs/Actives', apparatus: 'Poutre', salle: 'Salle 1' },
  { id: '4', time: '10:00', groupName: 'FSG Genève', category: 'Actifs/Actives', apparatus: 'Saut', salle: 'Salle 3' },
  { id: '5', time: '10:15', groupName: 'FSG Neuchâtel', category: 'Mixtes', apparatus: 'Sol', salle: 'Salle 2' },
  { id: '6', time: '10:30', groupName: 'FSG Fribourg', category: 'Actifs/Actives', apparatus: 'Barres', salle: 'Salle 1' },
  { id: '7', time: '10:45', groupName: 'FSG Sion', category: 'Actifs/Actives', apparatus: 'Poutre', salle: 'Salle 3' },
  { id: '8', time: '11:00', groupName: 'FSG Berne', category: 'Mixtes', apparatus: 'Saut', salle: 'Salle 2' }
]

const filteredSchedule = computed(() => {
  return scheduleData.filter(item => 
    selectedFilter.value === 'Tout' || item.apparatus === selectedFilter.value
  )
})

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
        :key="item.id" 
        class="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-white/15 active:scale-[0.98] transition-all"
        @click="handleGroupClick(item.groupName)"
      >
        <div class="text-center min-w-[60px]">
          <div class="text-cyan-400 font-bold text-lg">{{ item.time }}</div>
          <div class="text-white/50 text-xs">{{ item.salle }}</div>
        </div>

        <div class="flex-1 min-w-0">
          <h4 class="text-white font-bold mb-1">{{ item.groupName }}</h4>
          <div class="flex items-center gap-2 text-sm">
            <span class="text-white/60">{{ item.category }}</span>
            <span class="text-white/40">•</span>
            <span class="text-purple-400">{{ item.apparatus }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button 
            class="p-2 hover:bg-white/10 rounded-lg transition-colors"
            @click="handleInfoClick(item.groupName, $event)"
          >
            <Icon name="fluent:info-24-regular" class="w-5 h-5 text-white/60" />
          </button>
          <button 
            @click="toggleFavorite(item.id, $event)"
            class="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Icon 
              :name="favorites.has(item.id) ? 'fluent:heart-24-filled' : 'fluent:heart-24-regular'"
              class="w-5 h-5"
              :class="favorites.has(item.id) ? 'text-red-400' : 'text-white/60'"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
