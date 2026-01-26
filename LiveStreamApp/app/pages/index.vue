<script setup lang="ts">
interface Group {
  id: string
  name: string
  apparatus: string
  salle: string
  category: string
}

const openGroupDetails = inject<(name: string) => void>('openGroupDetails')

const happeningNow: Group[] = [
  { id: '1', name: 'FSG Yverdon', apparatus: 'Sol', salle: 'Salle 1', category: 'Actifs/Actives' },
  { id: '2', name: 'FSG Morges', apparatus: 'Barres', salle: 'Salle 2', category: 'Mixtes' },
  { id: '3', name: 'FSG Lausanne', apparatus: 'Poutre', salle: 'Salle 1', category: 'Actifs/Actives' },
  { id: '4', name: 'FSG Genève', apparatus: 'Saut', salle: 'Salle 3', category: 'Actifs/Actives' }
]

const handleGroupClick = (groupName: string) => {
  openGroupDetails?.(groupName)
}
</script>

<template>
  <div class="px-4 space-y-6 pb-6">
    <!-- Hero Live Card -->
    <div 
      class="glass-card overflow-hidden relative h-64 cursor-pointer active:scale-[0.98] transition-transform"
      @click="handleGroupClick('FSG Yverdon')"
    >
      <ImageWithFallback 
        src="https://images.unsplash.com/photo-1752297725917-ada2cb5d3409?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW1uYXN0aWNzJTIwY29tcGV0aXRpb24lMjBhY3Rpb258ZW58MXx8fHwxNzY5NDQwNDMzfDA&ixlib=rb-4.1.0&q=80&w=1080"
        alt="Gymnastics competition"
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 gradient-overlay" />
      
      <div class="absolute bottom-0 left-0 right-0 p-6">
        <div class="flex items-center gap-2 mb-3">
          <div class="flex items-center gap-2 bg-red-500/90 px-3 py-1.5 rounded-full">
            <span class="w-2 h-2 bg-white rounded-full animate-pulse-glow" />
            <span class="text-white text-sm font-medium">EN DIRECT</span>
          </div>
        </div>
        
        <h2 class="text-white text-2xl font-bold mb-1">FSG Yverdon</h2>
        <p class="text-white/80">Salle 1 • Sol</p>
      </div>
    </div>

    <!-- Happening Now Carousel -->
    <div>
      <h3 class="text-white text-lg font-bold mb-4 px-1">En piste maintenant</h3>
      <div class="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
        <div 
          v-for="group in happeningNow"
          :key="group.id"
          class="glass-card p-4 min-w-[200px] flex-shrink-0 cursor-pointer hover:bg-white/15 active:scale-[0.98] transition-all"
          @click="handleGroupClick(group.name)"
        >
          <div class="text-cyan-400 text-sm mb-2">{{ group.salle }}</div>
          <h4 class="text-white font-bold mb-1">{{ group.name }}</h4>
          <p class="text-white/60 text-sm">{{ group.apparatus }}</p>
          
          <button class="mt-3 w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
            <Icon name="fluent:play-24-filled" class="w-4 h-4" />
            <span class="text-sm">Regarder</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Info Tiles -->
    <div class="grid grid-cols-3 gap-3">
      <div class="glass-card p-4 flex flex-col items-center text-center">
        <div class="w-12 h-12 rounded-full bg-cyan-400/20 flex items-center justify-center mb-3">
          <Icon name="fluent:weather-partly-cloudy-day-24-regular" class="w-6 h-6 text-cyan-400" />
        </div>
        <span class="text-white/80 text-sm">Météo</span>
        <span class="text-white font-bold mt-1">23°C</span>
      </div>
      
      <div class="glass-card p-4 flex flex-col items-center text-center">
        <div class="w-12 h-12 rounded-full bg-purple-400/20 flex items-center justify-center mb-3">
          <Icon name="fluent:location-24-regular" class="w-6 h-6 text-purple-400" />
        </div>
        <span class="text-white/80 text-sm">Plan</span>
      </div>
      
      <div class="glass-card p-4 flex flex-col items-center text-center">
        <div class="w-12 h-12 rounded-full bg-cyan-400/20 flex items-center justify-center mb-3">
          <Icon name="fluent:food-24-regular" class="w-6 h-6 text-cyan-400" />
        </div>
        <span class="text-white/80 text-sm">Restau</span>
      </div>
    </div>
  </div>
</template>
