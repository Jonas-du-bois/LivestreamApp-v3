<script setup lang="ts">
import { PublicService } from '~/services/public.service'
import type { PassageEnriched } from '~/types/api'
import { io, type Socket } from 'socket.io-client'

// Extended type including rank
type PassageResult = PassageEnriched & { rank: number }

const openGroupDetails = inject<(name: string) => void>('openGroupDetails')

// Fetch data
const { data: resultsMap, refresh } = await PublicService.getResults()

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

const getRankClass = (rank: number) => {
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

let socket: Socket | null = null

onMounted(() => {
  socket = io({ path: '/socket.io' })

  socket.on('score-update', (updatedPassage: any) => {
    if (!resultsMap.value) return

    if (updatedPassage.status !== 'FINISHED') return

    const code = updatedPassage.apparatus?.code
    if (!code) return

    if (!resultsMap.value[code]) {
      resultsMap.value[code] = []
    }

    const list = resultsMap.value[code] as PassageResult[]

    if (!updatedPassage.group?.name || !updatedPassage.apparatus?.name) {
       refresh()
       return
    }

    const index = list.findIndex(p => p._id === updatedPassage._id)
    const newEntry = { ...updatedPassage, rank: 0 } as PassageResult

    if (index !== -1) {
      list[index] = newEntry
    } else {
      list.push(newEntry)
    }

    list.sort((a, b) => (b.scores?.total || 0) - (a.scores?.total || 0))
    list.forEach((p, i) => {
      p.rank = i + 1
    })
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
  <div class="px-4 space-y-8 pb-8">
    <!-- Empty State -->
    <div v-if="!resultsSections.length" class="text-center py-10 text-white/50">
      <p>Aucun résultat disponible pour le moment.</p>
    </div>

    <!-- Sections -->
    <div v-for="section in resultsSections" :key="section.code">
        <h3 class="text-white text-xl font-bold mb-4 flex items-center gap-2">
            <Icon v-if="section.icon" :name="section.icon" class="w-6 h-6 text-cyan-400" />
            {{ section.name }}
        </h3>

        <div class="space-y-3">
          <div
            v-for="result in section.results"
            :key="result._id"
            class="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-white/15 active:scale-[0.98] transition-all"
            :class="getRankClass(result.rank)"
            @click="handleGroupClick(result.group.name)"
          >
            <!-- Rank / Medal -->
            <div class="flex items-center justify-center w-12">
              <Icon
                v-if="getMedalIcon(result.rank)"
                :name="getMedalIcon(result.rank)!.name"
                class="w-6 h-6"
                :class="getMedalIcon(result.rank)!.class"
              />
              <span v-else class="text-white/40 font-bold text-lg">#{{ result.rank }}</span>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <h4 class="text-white font-bold text-lg mb-1">{{ result.group.name }}</h4>
              <p class="text-white/60 text-sm">{{ result.group.category || '-' }}</p>
            </div>

            <!-- Score -->
            <div class="text-right">
              <div class="text-cyan-400 font-bold text-2xl">{{ result.scores?.total?.toFixed(2) || '0.00' }}</div>
            </div>
          </div>
        </div>
    </div>
  </div>
</template>
