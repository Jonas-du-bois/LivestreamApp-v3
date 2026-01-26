<script setup lang="ts">
interface Result {
  rank: number
  groupName: string
  score: number
  category: string
}

const openGroupDetails = inject<(name: string) => void>('openGroupDetails')

const selectedApparatus = ref('Sol')
const apparatus = ['Sol', 'Barres', 'Poutre', 'Saut']

const resultsData: Record<string, Result[]> = {
  Sol: [
    { rank: 1, groupName: 'FSG Yverdon', score: 9.88, category: 'Actifs/Actives' },
    { rank: 2, groupName: 'FSG Lausanne', score: 9.76, category: 'Actifs/Actives' },
    { rank: 3, groupName: 'FSG Genève', score: 9.65, category: 'Actifs/Actives' },
    { rank: 4, groupName: 'FSG Morges', score: 9.52, category: 'Mixtes' },
    { rank: 5, groupName: 'FSG Neuchâtel', score: 9.41, category: 'Mixtes' }
  ],
  Barres: [
    { rank: 1, groupName: 'FSG Fribourg', score: 9.92, category: 'Actifs/Actives' },
    { rank: 2, groupName: 'FSG Berne', score: 9.81, category: 'Mixtes' },
    { rank: 3, groupName: 'FSG Sion', score: 9.73, category: 'Actifs/Actives' },
    { rank: 4, groupName: 'FSG Lausanne', score: 9.58, category: 'Actifs/Actives' },
    { rank: 5, groupName: 'FSG Genève', score: 9.45, category: 'Actifs/Actives' }
  ],
  Poutre: [
    { rank: 1, groupName: 'FSG Morges', score: 9.85, category: 'Mixtes' },
    { rank: 2, groupName: 'FSG Yverdon', score: 9.72, category: 'Actifs/Actives' },
    { rank: 3, groupName: 'FSG Neuchâtel', score: 9.68, category: 'Mixtes' },
    { rank: 4, groupName: 'FSG Fribourg', score: 9.53, category: 'Actifs/Actives' },
    { rank: 5, groupName: 'FSG Berne', score: 9.47, category: 'Mixtes' }
  ],
  Saut: [
    { rank: 1, groupName: 'FSG Genève', score: 9.95, category: 'Actifs/Actives' },
    { rank: 2, groupName: 'FSG Lausanne', score: 9.89, category: 'Actifs/Actives' },
    { rank: 3, groupName: 'FSG Yverdon', score: 9.77, category: 'Actifs/Actives' },
    { rank: 4, groupName: 'FSG Sion', score: 9.61, category: 'Actifs/Actives' },
    { rank: 5, groupName: 'FSG Morges', score: 9.55, category: 'Mixtes' }
  ]
}

const results = computed(() => resultsData[selectedApparatus.value] || [])
const podium = computed(() => results.value.slice(0, 3))
const otherResults = computed(() => results.value.slice(3))

const getMedalIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return { name: 'fluent:trophy-24-filled', class: 'text-yellow-400' }
    case 2:
      return { name: 'fluent:ribbon-24-filled', class: 'text-gray-300' }
    case 3:
      return { name: 'fluent:ribbon-24-filled', class: 'text-amber-600' }
    default:
      return null
  }
}

const getPodiumBorderColor = (rank: number) => {
  switch (rank) {
    case 1:
      return 'ring-2 ring-yellow-400 glow-cyan'
    case 2:
      return 'ring-2 ring-gray-300'
    case 3:
      return 'ring-2 ring-amber-600'
    default:
      return ''
  }
}

const handleGroupClick = (groupName: string) => {
  openGroupDetails?.(groupName)
}
</script>

<template>
  <div class="px-4 space-y-6 pb-6">
    <!-- Apparatus Tabs -->
    <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      <button
        v-for="app in apparatus"
        :key="app"
        @click="selectedApparatus = app"
        class="px-5 py-2.5 rounded-full text-sm font-medium flex-shrink-0 transition-all"
        :class="selectedApparatus === app
          ? 'gradient-cyan-purple text-white'
          : 'glass-card text-white/80'"
      >
        {{ app }}
      </button>
    </div>

    <!-- Podium -->
    <div>
      <h3 class="text-white text-lg font-bold mb-4 px-1">Podium</h3>
      <div class="space-y-3">
        <div 
          v-for="result in podium"
          :key="result.rank"
          class="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-white/15 active:scale-[0.98] transition-all"
          :class="getPodiumBorderColor(result.rank)"
          @click="handleGroupClick(result.groupName)"
        >
          <div class="flex items-center justify-center w-12">
            <Icon 
              v-if="getMedalIcon(result.rank)"
              :name="getMedalIcon(result.rank)!.name" 
              class="w-6 h-6"
              :class="getMedalIcon(result.rank)!.class"
            />
          </div>

          <div class="flex-1 min-w-0">
            <h4 class="text-white font-bold text-lg mb-1">{{ result.groupName }}</h4>
            <p class="text-white/60 text-sm">{{ result.category }}</p>
          </div>

          <div class="text-right">
            <div class="text-cyan-400 font-bold text-2xl">{{ result.score.toFixed(2) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Other Results -->
    <div v-if="otherResults.length > 0">
      <h3 class="text-white text-lg font-bold mb-4 px-1">Classement complet</h3>
      <div class="space-y-2">
        <div 
          v-for="result in otherResults"
          :key="result.rank"
          class="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-white/15 active:scale-[0.98] transition-all"
          @click="handleGroupClick(result.groupName)"
        >
          <div class="flex items-center justify-center w-8">
            <span class="text-white/40 font-bold">#{{ result.rank }}</span>
          </div>

          <div class="flex-1 min-w-0">
            <h4 class="text-white font-bold mb-1">{{ result.groupName }}</h4>
            <p class="text-white/60 text-sm">{{ result.category }}</p>
          </div>

          <div class="text-right">
            <div class="text-white font-bold text-xl">{{ result.score.toFixed(2) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
