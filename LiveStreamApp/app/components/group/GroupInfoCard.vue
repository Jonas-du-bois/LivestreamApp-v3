<script setup lang="ts">
import type { Group, HistoryEntry } from '../../types/api'

interface Props {
  group: Group
}

const props = defineProps<Props>()

const getInitials = (name: string) => {
  if (!name) return ''
  return name.split(' ').map((n: string) => n[0]).join('')
}

const isFavorite = ref(false)

const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value
}

// Compute stats from props
const gymnastsCount = computed(() => props.group.gymnastsCount ?? 0)
const monitorsCount = computed(() => props.group.monitors?.length ?? 0)
const averageScore = computed(() => {
  if (!props.group.history?.length) return 0
  const sum = props.group.history.reduce((acc: number, curr: HistoryEntry) => acc + curr.score, 0)
  return (sum / props.group.history.length).toFixed(2)
})

const monitors = computed(() => props.group.monitors ?? [])

// Group history by year for the timeline
const historyByYear = computed(() => {
  if (!props.group.history) return []

  const map = new Map<number, number[]>()
  props.group.history.forEach((h: HistoryEntry) => {
    if (!map.has(h.year)) map.set(h.year, [])
    map.get(h.year)?.push(h.score)
  })

  return Array.from(map.entries()).map(([year, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    return { year, score: avg }
  }).sort((a, b) => a.year - b.year)
})
</script>

<template>
  <div class="glass-panel overflow-hidden flex flex-col">
    <!-- Header with Photo and Wave Mask -->
    <div class="relative h-48 overflow-hidden flex-shrink-0">
      <ImageWithFallback
        :src="group.logo || 'https://images.unsplash.com/photo-1764622078388-df36863688d3?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'"
        :alt="group.name"
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0B1120]" />
      <svg
        class="absolute bottom-0 w-full"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style="height: 60px"
      >
        <path
          d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
          fill="#0B1120"
        />
      </svg>

      <div class="absolute bottom-6 left-6 right-6 z-10">
        <h2 class="text-white font-bold text-2xl mb-1">{{ group.name }}</h2>
        <p class="text-white/80">{{ group.canton }}</p>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 p-6 space-y-6">
      <!-- Stats Grid -->
      <div class="grid grid-cols-3 gap-3">
        <div class="glass-card p-4 text-center">
          <Icon name="fluent:people-24-regular" class="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <div class="text-white font-bold text-xl">{{ gymnastsCount }}</div>
          <div class="text-white/60 text-xs">Gymnastes</div>
        </div>
        <div class="glass-card p-4 text-center">
          <Icon name="fluent:person-24-regular" class="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div class="text-white font-bold text-xl">{{ monitorsCount }}</div>
          <div class="text-white/60 text-xs">Moniteurs</div>
        </div>
        <div class="glass-card p-4 text-center">
          <Icon name="fluent:arrow-trending-24-regular" class="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <div class="text-white font-bold text-xl">{{ averageScore }}</div>
          <div class="text-white/60 text-xs">Moyenne</div>
        </div>
      </div>

      <!-- Coaches -->
      <div v-if="monitors.length > 0">
        <h3 class="text-white font-bold mb-3">Moniteurs</h3>
        <div class="glass-card p-4 space-y-3">
          <div
            v-for="coach in monitors"
            :key="coach"
            class="flex items-center gap-3"
          >
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center flex-shrink-0">
              <span class="text-white text-sm font-bold">
                {{ getInitials(coach) }}
              </span>
            </div>
            <span class="text-white">{{ coach }}</span>
          </div>
        </div>
      </div>

      <!-- Historical Timeline -->
      <div v-if="historyByYear.length > 0">
        <div class="flex items-center gap-2 mb-3">
          <Icon name="fluent:history-24-regular" class="w-5 h-5 text-cyan-400" />
          <h3 class="text-white font-bold">Historique des notes</h3>
        </div>
        <div class="glass-card p-4">
          <div class="space-y-2">
            <div
              v-for="data in historyByYear"
              :key="data.year"
              class="flex items-center gap-4"
            >
              <span class="text-white/60 text-sm w-12">{{ data.year }}</span>
              <div class="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  class="h-full gradient-cyan-purple rounded-full"
                  :style="{ width: `${(data.score / 10) * 100}%` }"
                />
              </div>
              <span class="text-cyan-400 font-bold text-sm w-10">{{ data.score.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Action -->
    <div class="p-6 border-t border-white/10 flex-shrink-0">
      <button
        @click="toggleFavorite"
        class="w-full gradient-cyan-purple py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <Icon
          :name="isFavorite ? 'fluent:heart-24-filled' : 'fluent:heart-24-regular'"
          class="w-5 h-5"
        />
        {{ isFavorite ? 'Retirer des Favoris' : 'Ajouter aux Favoris' }}
      </button>
    </div>
  </div>
</template>
