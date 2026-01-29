<script setup lang="ts">
import { PublicService } from '~/services/public.service'
import type { PassageEnriched } from '~/types/api'
import { io, type Socket } from 'socket.io-client'

// Extended type including rank
type PassageResult = PassageEnriched & { rank: number }

const openGroupDetails = inject<(name: string) => void>('openGroupDetails')

// Fetch data
const { data: resultsMap } = await PublicService.getResults()

// Active tab state
const activeTab = ref<string | null>(null)

// Computed properties
const resultsSections = computed(() => {
  const map = resultsMap.value
  if (!map) return []

  return Object.keys(map).map(code => {
    const list = map[code] || []
    const first = list[0]
    return {
      code,
      name: first?.apparatus?.name || code,
      icon: first?.apparatus?.icon,
      results: list
    }
  })
})

// Initialize active tab to first section
watch(resultsSections, (sections) => {
  if (sections.length > 0 && !activeTab.value) {
    // Ensure sections[0] is defined before accessing code to avoid "object possibly undefined"
    activeTab.value = sections[0]?.code ?? null
  }
}, { immediate: true })

// Get current active section
const activeSection = computed(() => {
  return resultsSections.value.find(s => s.code === activeTab.value)
})

// Get podium (top 3)
const podiumResults = computed(() => {
  if (!activeSection.value) return []
  return activeSection.value.results.slice(0, 3)
})

// Get full ranking (from rank 4 onwards)
const fullRanking = computed(() => {
  if (!activeSection.value) return []
  return activeSection.value.results.slice(3)
})

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

const getPodiumBorderClass = (rank: number) => {
  switch (rank) {
    case 1:
      return 'border-yellow-400'
    case 2:
      return 'border-gray-300'
    case 3:
      return 'border-amber-600'
    default:
      return 'border-white/10'
  }
}

const handleGroupClick = (groupId: string) => {
  openGroupDetails?.(groupId)
}

let socket: Socket | null = null

onMounted(() => {
  // Force websocket transport to avoid polling requests being routed to the SPA router
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  socket = io(origin, { path: '/socket.io', transports: ['websocket'] })

  socket.on('connect', () => {
    console.log('[socket] connected', socket?.id)
    socket?.emit('join-room', 'live-scores')
  })

  socket.on('connect_error', (err: any) => {
    console.error('[socket] connect_error', err)
  })

  socket.on('disconnect', (reason: any) => {
    console.warn('[socket] disconnected', reason)
  })

  socket.on('score-update', (data: any) => {
    // Data payload: { passageId, totalScore, rank, apparatusCode }
    // If mismatch, try to find passage locally
    if (!resultsMap.value) return

    // We search through all lists because we might not know the apparatus code from the summary payload easily
    // Or if we have apparatusCode, we can narrow it down.
    const keys = Object.keys(resultsMap.value)

    let found = false
    let targetList: PassageResult[] | null = null

    for (const key of keys) {
      const list = resultsMap.value[key] as PassageResult[]
      const passage = list.find(p => p._id === data.passageId)
      if (passage) {
        // Update properties
        passage.scores = passage.scores || {}
        if (data.totalScore !== undefined) passage.scores.total = data.totalScore
        if (data.rank !== undefined) passage.rank = data.rank

        // Mark as finished if not already (implied by score update)
        if (passage.status !== 'FINISHED') passage.status = 'FINISHED'

        // Trigger Flash Effect
        const el = document.getElementById(`result-${data.passageId}`)
        if (el) {
          el.classList.add('flash-green')
          setTimeout(() => el.classList.remove('flash-green'), 2000)
        }

        targetList = list
        found = true
        break
      }
    }

    // If not found, or full payload was sent, try legacy logic (direct mutation)
    // STRICTLY NO REFRESH CALLS HERE
    if (!found && data.group && data.apparatus) {
       // It's a full object, use original logic (fallback)
       const code = data.apparatus.code
       if (code) {
         if (!resultsMap.value[code]) resultsMap.value[code] = []
         const list = resultsMap.value[code] as PassageResult[]
         const index = list.findIndex(p => p._id === data._id)
         const newEntry = { ...data, rank: 0 } as PassageResult
         if (index !== -1) list[index] = newEntry
         else list.push(newEntry)
         targetList = list
       }
    }

    // Re-sort and re-rank the specific list if needed
    if (targetList) {
      targetList.sort((a, b) => (b.scores?.total || 0) - (a.scores?.total || 0))
      targetList.forEach((p, i) => {
        p.rank = i + 1
      })
    }
  })
})

onUnmounted(() => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
})
</script>

<template>
  <div class="min-h-screen">
    

    <!-- Empty State -->
    <div v-if="!resultsSections.length" class="text-center py-10 text-white/50 px-4">
      <p>Aucun résultat disponible pour le moment.</p>
    </div>

    <!-- Tabs Navigation -->
    <div v-if="resultsSections.length" class="px-4">
      <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        <button
          v-for="section in resultsSections"
          :key="section.code"
          @click="activeTab = section.code"
          class="px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-all"
          :class="activeTab === section.code 
            ? 'bg-cyan-400 text-[#0B1120]' 
            : 'glass-card text-white/80'"
        >
          {{ section.name }}
        </button>
      </div>
    </div>

    <!-- Content for active tab -->
    <div v-if="activeSection" class="px-4 mt-6 space-y-6">
      <!-- Podium Section -->
      <div v-if="podiumResults.length > 0">
        <h2 class="text-white text-xl font-bold mb-4">Podium</h2>
        <div class="space-y-3">
          <div
            v-for="result in podiumResults"
            :key="result._id"
            :id="'result-' + result._id"
            class="glass-card p-4 rounded-2xl border-2 cursor-pointer hover:bg-white/15 active:scale-[0.98] transition-all"
            :class="getPodiumBorderClass(result.rank)"
            @click="handleGroupClick(result.group._id)"
          >
            <div class="flex items-center gap-4">
              <!-- Medal Icon -->
              <div class="flex items-center justify-center w-12 h-12">
                <Icon
                  v-if="getMedalIcon(result.rank)"
                  :name="getMedalIcon(result.rank)!.name"
                  class="w-8 h-8"
                  :class="getMedalIcon(result.rank)!.class"
                />
              </div>

              <!-- Group Info -->
              <div class="flex-1 min-w-0">
                <h3 class="text-white font-bold text-lg">{{ result.group.name }}</h3>
                <p class="text-white/60 text-sm">{{ result.group.category || 'Actifs/Actives' }}</p>
              </div>

              <!-- Score -->
              <div class="text-cyan-400 font-bold text-3xl">
                {{ result.scores?.total?.toFixed(2) || '0.00' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Full Ranking Section -->
      <div v-if="fullRanking.length > 0">
        <h2 class="text-white text-xl font-bold mb-4">Classement complet</h2>
        <div class="space-y-3">
          <div
            v-for="result in fullRanking"
            :key="result._id"
            :id="'result-' + result._id"
            class="glass-card p-4 rounded-2xl cursor-pointer hover:bg-white/15 active:scale-[0.98] transition-all"
            @click="handleGroupClick(result.group._id)"
          >
            <div class="flex items-center gap-4">
              <!-- Rank Number -->
              <div class="flex items-center justify-center w-12">
                <span class="text-white/40 font-bold text-xl">#{{ result.rank }}</span>
              </div>

              <!-- Group Info -->
              <div class="flex-1 min-w-0">
                <h3 class="text-white font-bold text-lg">{{ result.group.name }}</h3>
                <p class="text-white/60 text-sm">{{ result.group.category || 'Mixtes' }}</p>
              </div>

              <!-- Score -->
              <div class="text-white font-bold text-2xl">
                {{ result.scores?.total?.toFixed(2) || '0.00' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No results for this apparatus -->
      <div v-if="activeSection.results.length === 0" class="text-center py-10 text-white/50">
        <p>Aucun résultat pour cet agrès.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.flash-green {
  animation: flash 2s ease-out;
}

@keyframes flash {
  0% {
    background-color: rgba(74, 222, 128, 0.5); /* green-400 */
    box-shadow: 0 0 15px rgba(74, 222, 128, 0.5);
  }
  100% {
    background-color: transparent;
    box-shadow: none;
  }
}
</style>