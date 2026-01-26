<script setup lang="ts">
interface FavoriteItem {
  id: string
  groupName: string
  time: string
  date: string
  apparatus: string
  salle: string
  category: string
}

const openGroupDetails = inject<(name: string) => void>('openGroupDetails')

const favorites: FavoriteItem[] = [
  {
    id: '1',
    groupName: 'FSG Genève',
    time: '10:00',
    date: 'Samedi 26 Jan',
    apparatus: 'Saut',
    salle: 'Salle 3',
    category: 'Actifs/Actives'
  },
  {
    id: '2',
    groupName: 'FSG Morges',
    time: '09:30',
    date: 'Samedi 26 Jan',
    apparatus: 'Barres',
    salle: 'Salle 2',
    category: 'Mixtes'
  },
  {
    id: '3',
    groupName: 'FSG Lausanne',
    time: '09:45',
    date: 'Samedi 26 Jan',
    apparatus: 'Poutre',
    salle: 'Salle 1',
    category: 'Actifs/Actives'
  }
]

// Calculate time until next event (mock)
const nextEventMinutes = ref(45)

const formattedTime = computed(() => {
  const hours = Math.floor(nextEventMinutes.value / 60)
  const minutes = nextEventMinutes.value % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
})

const handleGroupClick = (groupName: string) => {
  openGroupDetails?.(groupName)
}
</script>

<template>
  <div class="px-4 space-y-6 pb-6">
    <!-- Next Alert Card -->
    <div class="glass-panel p-6 text-center">
      <div class="text-white/60 text-sm mb-2">Prochaine alerte</div>
      <div class="flex items-center justify-center gap-2 mb-3">
        <Icon name="fluent:clock-24-regular" class="w-6 h-6 text-cyan-400" />
        <div class="text-white font-bold text-4xl tabular-nums">
          {{ formattedTime }}
        </div>
      </div>
      <div class="text-white/80">FSG Genève passe dans 45 minutes</div>
    </div>

    <!-- Timeline -->
    <div>
      <h3 class="text-white text-lg font-bold mb-4 px-1">Mon planning</h3>
      <div class="relative">
        <!-- Timeline Line -->
        <div class="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-cyan-400 via-purple-400 to-cyan-400" />

        <div class="space-y-4">
          <div 
            v-for="(event, index) in favorites"
            :key="event.id" 
            class="relative flex gap-4 cursor-pointer hover:opacity-80 transition-opacity"
            @click="handleGroupClick(event.groupName)"
          >
            <!-- Timeline Dot -->
            <div class="relative flex-shrink-0">
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center z-10 relative"
                :class="index === 0 ? 'bg-cyan-400 glow-cyan' : 'glass-card'"
              >
                <Icon 
                  name="fluent:calendar-24-regular" 
                  class="w-5 h-5"
                  :class="index === 0 ? 'text-[#0B1120]' : 'text-white/80'"
                />
              </div>
            </div>

            <!-- Event Card -->
            <div class="flex-1 glass-card p-4">
              <div class="flex items-start justify-between mb-2">
                <div>
                  <h4 class="text-white font-bold text-lg">{{ event.groupName }}</h4>
                  <p class="text-white/60 text-sm">{{ event.category }}</p>
                </div>
                <div class="text-right">
                  <div class="text-cyan-400 font-bold">{{ event.time }}</div>
                  <div class="text-white/50 text-xs">{{ event.date }}</div>
                </div>
              </div>

              <div class="flex items-center gap-4 text-sm">
                <span class="text-purple-400">{{ event.apparatus }}</span>
                <span class="text-white/40">•</span>
                <span class="text-white/60">{{ event.salle }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State Hint -->
    <div 
      v-if="favorites.length === 0"
      class="glass-panel p-8 text-center"
    >
      <div class="text-white/60 mb-2">Aucun favori pour le moment</div>
      <p class="text-white/40 text-sm">
        Ajoutez des groupes en favoris pour créer votre planning personnalisé
      </p>
    </div>
  </div>
</template>
