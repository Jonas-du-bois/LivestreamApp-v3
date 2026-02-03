<script lang="ts">
// Static cache to persist across component instances
const detailsCache = new Map<string, any>()
</script>

<script setup lang="ts">
import { PublicService } from '../../services/public.service'
import { useSocket } from '../../composables/useSocket'
import type { PassageEnriched, HistoryEntry } from '../../types/api'

interface Props {
  isOpen: boolean
  groupId?: string
  groupName?: string
  apparatusCode?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const socket = useSocket()
const isLoading = ref(false)
const error = ref<string | null>(null)
const details = ref<any>(null)
const isFavorite = ref(false)
const activeTab = ref<'timeline' | 'stats'>('timeline')

const fetchData = async () => {
  if (!props.groupId) return

  // Check cache first
  if (detailsCache.has(props.groupId)) {
    details.value = detailsCache.get(props.groupId)
    return
  }

  isLoading.value = true
  error.value = null
  try {
    const data = await PublicService.fetchGroupDetails(props.groupId)
    details.value = data
    detailsCache.set(props.groupId, data)
  } catch (err) {
    console.error(err)
    error.value = "Impossible de charger les détails du groupe."
  } finally {
    isLoading.value = false
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.groupId) {
    fetchData()
    activeTab.value = 'timeline' // Reset to timeline on open
  }
})

watch(() => props.groupId, (newId) => {
  if (props.isOpen && newId) {
    fetchData()
  }
})

// Real-time updates
const handleScoreUpdate = (payload: any) => {
  if (!details.value || !details.value.timeline) return

  const passage = details.value.timeline.find((p: any) => p._id === payload.passageId)
  if (passage) {
    if (payload.score !== undefined) {
      passage.score = payload.score;
      passage.status = 'FINISHED';
      recomputeStats();
    }
  }
}

const recomputeStats = () => {
   if (!details.value) return
   const finished = details.value.timeline.filter((p: any) => p.status === 'FINISHED' && typeof p.score === 'number')
   const total = finished.reduce((acc: number, curr: any) => acc + (curr.score || 0), 0)
   const count = finished.length

   details.value.stats.completedPassages = count
   details.value.stats.currentTotalScore = count > 0 ? (total / count).toFixed(2) : '0.00'
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

onMounted(() => {
  socket.on('score-update', handleScoreUpdate)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  socket.off('score-update', handleScoreUpdate)
  window.removeEventListener('keydown', handleKeydown)
})

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value
}

const getInitials = (name: string) => {
  if (!name) return ''
  return name.split(' ').map((n: string) => n[0]).join('')
}

// Computed properties
const categoryLabel = computed(() => {
  if (!details.value?.info) return 'Groupe Actif'
  return details.value.info.category === 'MIXTE' ? 'Groupe Mixte' : 'Groupe Actif'
})

const categoryColor = computed(() => {
  if (!details.value?.info) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  return details.value.info.category === 'MIXTE' 
    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
    : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
})

// Canton display: utilise le canton de la DB, sinon extrait du nom (partie avant ":")
const cantonDisplay = computed(() => {
  if (!details.value?.info) return null
  if (details.value.info.canton) return details.value.info.canton
  // Fallback: extraire du nom
  const name = details.value.info.name || ''
  if (name.includes(':')) return name.split(':')[0].trim()
  return null
})

const gymnastsCount = computed(() => details.value?.info?.gymnastsCount ?? 0)
const monitorsCount = computed(() => details.value?.monitors?.length ?? 0)
const monitors = computed(() => details.value?.monitors ?? [])

interface HistoryPoint {
  year: number
  score: number
}

const historyByYear = computed<HistoryPoint[]>(() => {
  if (!details.value?.history) return []

  let rawHistory = details.value.history as any[]

  // Filter by apparatus if provided
  if (props.apparatusCode) {
    rawHistory = rawHistory.filter(h => h.apparatus === props.apparatusCode)
  }

  // Aggregate by year
  const yearMap = new Map<number, { total: number; count: number }>()
  rawHistory.forEach(h => {
     if (!yearMap.has(h.year)) yearMap.set(h.year, { total: 0, count: 0 })
     const entry = yearMap.get(h.year)!
     entry.total += h.score
     entry.count++
  })

  // Convert to array
  const aggregated: HistoryPoint[] = Array.from(yearMap.entries()).map(([year, data]) => ({
    year,
    score: data.total / data.count
  }))

  return aggregated.sort((a, b) => a.year - b.year)
})

const averageHistoryScore = computed(() => {
  const list = historyByYear.value
  if (!list.length) return '0.00'
  const sum = list.reduce((acc: number, curr: any) => acc + (Number(curr.score) || 0), 0)
  return (sum / list.length).toFixed(2)
})

// Helper computed properties pour éviter les erreurs TypeScript
const firstHistoryScore = computed(() => {
  const list = historyByYear.value
  return list.length > 0 ? list[0]?.score ?? 0 : 0
})

const lastHistoryScore = computed(() => {
  const list = historyByYear.value
  return list.length > 0 ? list[list.length - 1]?.score ?? 0 : 0
})

const historyTrend = computed(() => {
  const list = historyByYear.value
  if (list.length <= 1) return 'stable'
  const first = firstHistoryScore.value
  const last = lastHistoryScore.value
  if (last > first) return 'up'
  if (last < first) return 'down'
  return 'stable'
})

const historyEvolutionValue = computed(() => {
  const list = historyByYear.value
  if (list.length <= 1) return '0.00'
  return Math.abs(lastHistoryScore.value - firstHistoryScore.value).toFixed(2)
})

const maxHistoryScore = computed(() => {
  const list = historyByYear.value
  if (!list.length) return '0.00'
  return Math.max(...list.map((d: any) => d.score ?? 0)).toFixed(2)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80]"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="scale">
      <div
        v-if="isOpen"
        class="fixed md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90%] md:max-w-2xl glass-panel z-[90] overflow-hidden flex flex-col max-h-[90vh] overlay-safe-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-details-title"
      >
        <div v-if="isLoading && !details" class="p-12 text-center text-white/60">
           <Icon name="fluent:spinner-ios-20-filled" class="w-8 h-8 animate-spin mx-auto mb-4" />
           <p>Chargement du tableau de bord...</p>
        </div>

        <div v-else-if="error" class="p-12 text-center text-red-400">
           <Icon name="fluent:error-circle-24-regular" class="w-8 h-8 mx-auto mb-4" />
           <p>{{ error }}</p>
        </div>

        <template v-else-if="details">
            <!-- Header with Image -->
            <div class="relative h-52 overflow-hidden flex-shrink-0">
              <ImageWithFallback
                :src="details.info.logo || 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2340&auto=format&fit=crop'"
                :alt="details.info.name"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0B1120]" />
              
              <!-- Wave SVG -->
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

              <!-- Close button -->
              <button
                @click="emit('close')"
                class="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <Icon name="fluent:dismiss-24-regular" class="w-5 h-5 text-white" />
              </button>

              <!-- Title & Category -->
              <div class="absolute bottom-6 left-6 right-6 z-10">
                <div class="flex items-start justify-between gap-3 mb-2">
                  <h2 id="group-details-title" class="text-white font-bold text-2xl md:text-3xl leading-tight">{{ details.info.name }}</h2>
                  
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span v-if="cantonDisplay" class="px-2 py-0.5 rounded-md bg-white/10 text-xs font-bold text-white border border-white/20">
                    {{ cantonDisplay }}
                  </span>
                  <div :class="['px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 border', categoryColor]">
                    {{ categoryLabel }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab Navigation -->
            <div class="flex border-b border-white/10 bg-[#0B1120]/80 backdrop-blur-sm flex-shrink-0" role="tablist">
              <button
                @click="activeTab = 'timeline'"
                :class="[
                  'flex-1 py-4 px-6 font-semibold transition-colors relative',
                  activeTab === 'timeline' ? 'text-cyan-400' : 'text-white/60 hover:text-white/80'
                ]"
                role="tab"
                :aria-selected="activeTab === 'timeline'"
                aria-controls="panel-timeline"
              >
                <Icon name="fluent:timeline-24-regular" class="w-5 h-5 inline-block mr-2" />
                Timeline
                <div v-if="activeTab === 'timeline'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400" />
              </button>
              <button
                @click="activeTab = 'stats'"
                :class="[
                  'flex-1 py-4 px-6 font-semibold transition-colors relative',
                  activeTab === 'stats' ? 'text-cyan-400' : 'text-white/60 hover:text-white/80'
                ]"
                role="tab"
                :aria-selected="activeTab === 'stats'"
                aria-controls="panel-stats"
              >
                <Icon name="fluent:data-bar-vertical-24-regular" class="w-5 h-5 inline-block mr-2" />
                Statistiques
                <div v-if="activeTab === 'stats'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400" />
              </button>
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-y-auto">
              <!-- TIMELINE TAB -->
              <div v-show="activeTab === 'timeline'" class="p-6" id="panel-timeline" role="tabpanel">
                <!-- Quick Stats -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div class="glass-card p-4 flex flex-col items-center justify-center bg-white/5">
                    <Icon name="fluent:checkmark-circle-24-regular" class="w-6 h-6 text-cyan-400 mb-2" />
                    <div class="text-2xl font-bold text-white leading-none mb-1">
                      {{ details.stats.completedPassages }} <span class="text-sm text-white/40 font-normal">/ {{ details.stats.totalPassages }}</span>
                    </div>
                    <div class="text-xs text-white/50">Passages terminés</div>
                  </div>
                  <div class="glass-card p-4 flex flex-col items-center justify-center bg-white/5">
                    <Icon name="fluent:arrow-trending-24-regular" class="w-6 h-6 text-purple-400 mb-2" />
                    <div class="text-2xl font-bold text-white leading-none mb-1">{{ details.stats.currentTotalScore }}</div>
                    <div class="text-xs text-white/50">Note Moyenne</div>
                  </div>
                </div>

                <!-- Timeline -->
                <h3 class="text-white font-bold mb-4 flex items-center gap-2">
                  <Icon name="fluent:calendar-clock-24-regular" class="w-5 h-5 text-cyan-400" />
                  Déroulement de la journée
                </h3>
                <div class="space-y-4 relative">
                  <!-- Vertical Line -->
                  <div class="absolute left-[19px] top-2 bottom-2 w-0.5 bg-white/10" />

                  <div 
                    v-for="item in details.timeline"
                    :key="item._id"
                    class="relative pl-12"
                  >
                    <!-- Icon Bubble -->
                    <div
                      class="absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 bg-[#0B1120]"
                      :class="item.status === 'LIVE' ? 'border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' :
                              item.status === 'FINISHED' ? 'border-cyan-400 text-cyan-400' : 'border-white/20 text-white/40'"
                    >
                      <Icon :name="item.apparatus.icon || 'fluent:circle-24-regular'" class="w-5 h-5" />
                    </div>

                    <!-- Content Card -->
                    <div class="glass-card p-4 hover:bg-white/10 transition-colors">
                      <div class="flex justify-between items-start mb-2">
                        <div>
                          <div class="font-bold text-white text-lg leading-tight mb-0.5">{{ item.apparatus.name }}</div>
                          <div class="text-xs text-white/50 flex items-center gap-1.5">
                            <Icon name="fluent:clock-24-regular" class="w-3.5 h-3.5" />
                            <span>{{ formatTime(item.startTime) }}</span>
                            <span>•</span>
                            <Icon name="fluent:location-24-regular" class="w-3.5 h-3.5" />
                            <span>{{ item.location || 'Salle 1' }}</span>
                          </div>
                        </div>
                        <div v-if="item.status === 'FINISHED'" class="text-right">
                          <div class="text-2xl font-bold text-cyan-400 leading-none">{{ item.score?.toFixed(2) || '0.00' }}</div>
                        </div>
                        <div v-else-if="item.status === 'LIVE'" class="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 animate-pulse">
                          🔴 EN COURS
                        </div>
                        <div v-else class="text-white/40 text-sm italic">
                          À venir
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- STATS TAB -->
              <div v-show="activeTab === 'stats'" class="p-6 space-y-6" id="panel-stats" role="tabpanel">
                <!-- Stats Grid -->
                <div>
                  <h3 class="text-white font-bold mb-4 flex items-center gap-2">
                    <Icon name="fluent:data-bar-vertical-24-regular" class="w-5 h-5 text-cyan-400" />
                    Vue d'ensemble
                  </h3>
                  <div class="grid grid-cols-3 gap-3">
                    <div class="glass-card p-4 text-center bg-white/5">
                      <Icon name="fluent:people-24-regular" class="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                      <div class="text-white font-bold text-xl">{{ gymnastsCount }}</div>
                      <div class="text-white/60 text-xs">Gymnastes</div>
                    </div>
                    <div class="glass-card p-4 text-center bg-white/5">
                      <Icon name="fluent:person-24-regular" class="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <div class="text-white font-bold text-xl">{{ monitorsCount }}</div>
                      <div class="text-white/60 text-xs">Moniteurs</div>
                    </div>
                    <div class="glass-card p-4 text-center bg-white/5">
                      <Icon name="fluent:trophy-24-regular" class="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                      <div class="text-white font-bold text-xl">{{ averageHistoryScore }}</div>
                      <div class="text-white/60 text-xs">Moy. Hist.</div>
                    </div>
                  </div>
                </div>

                <!-- Category Info for MIXTE -->
                <div v-if="details.info.category === 'MIXTE'" class="glass-card p-4 bg-purple-500/5 border border-purple-500/20">
                  <div class="flex items-start gap-3">
                    <Icon name="fluent:people-team-24-regular" class="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 class="text-white font-semibold text-sm mb-1">Groupe Mixte</h4>
                      <p class="text-white/60 text-xs">
                        Ce groupe participe dans la catégorie mixte, combinant gymnastes féminins et masculins.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Monitors List -->
                <div v-if="monitors.length > 0">
                  <h3 class="text-white font-bold mb-3 flex items-center gap-2">
                    <Icon name="fluent:people-team-24-regular" class="w-5 h-5 text-cyan-400" />
                    Équipe d'encadrement
                  </h3>
                  <div class="glass-card p-4 space-y-3 bg-white/5">
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

                <!-- Historical Performance -->
                <div v-if="historyByYear.length > 0">
                  <div class="flex items-center gap-2 mb-3">
                    <Icon name="fluent:history-24-regular" class="w-5 h-5 text-cyan-400" />
                    <h3 class="text-white font-bold">Historique des performances</h3>
                  </div>
                  <div class="glass-card p-5 bg-white/5">
                    <!-- Chart Container -->
                    <div class="relative h-48 mb-4">
                      <!-- Y-axis labels -->
                      <div class="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-white/40 pr-2">
                        <span>10.0</span>
                        <span>7.5</span>
                        <span>5.0</span>
                        <span>2.5</span>
                        <span>0.0</span>
                      </div>

                      <!-- Chart area -->
                      <div class="ml-8 h-full relative">
                        <!-- Grid lines -->
                        <div class="absolute inset-0 flex flex-col justify-between">
                          <div class="border-t border-white/5"></div>
                          <div class="border-t border-white/5"></div>
                          <div class="border-t border-white/5"></div>
                          <div class="border-t border-white/5"></div>
                          <div class="border-t border-white/10"></div>
                        </div>

                        <!-- SVG Line Chart -->
                        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <!-- Define gradient for the line -->
                          <defs>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" style="stop-color:#22d3ee;stop-opacity:1" />
                              <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
                            </linearGradient>
                            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" style="stop-color:#22d3ee;stop-opacity:0.2" />
                              <stop offset="100%" style="stop-color:#a855f7;stop-opacity:0.05" />
                            </linearGradient>
                          </defs>

                          <!-- Area under the curve -->
                          <path
                            v-if="historyByYear.length > 0"
                            :d="`M 0,100 ${historyByYear.map((d, i) => {
                              const x = (i / Math.max(historyByYear.length - 1, 1)) * 100
                              const y = 100 - (d.score / 10 * 100)
                              return `L ${x},${y}`
                            }).join(' ')} L 100,100 Z`"
                            fill="url(#areaGradient)"
                          />

                          <!-- Line -->
                          <polyline
                            v-if="historyByYear.length > 0"
                            :points="historyByYear.map((d, i) => {
                              const x = (i / Math.max(historyByYear.length - 1, 1)) * 100
                              const y = 100 - (d.score / 10 * 100)
                              return `${x},${y}`
                            }).join(' ')"
                            fill="none"
                            stroke="url(#lineGradient)"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            vector-effect="non-scaling-stroke"
                          />

                          <!-- Data points -->
                          <circle
                            v-for="(data, index) in historyByYear"
                            :key="data.year"
                            :cx="(index / Math.max(historyByYear.length - 1, 1)) * 100"
                            :cy="100 - (data.score / 10 * 100)"
                            r="2"
                            fill="#0B1120"
                            stroke="url(#lineGradient)"
                            stroke-width="1.5"
                            vector-effect="non-scaling-stroke"
                            class="cursor-pointer"
                          >
                            <title>{{ data.year }}: {{ data.score.toFixed(2) }}</title>
                          </circle>
                        </svg>
                      </div>
                    </div>

                    <!-- X-axis labels (years) -->
                    <div class="ml-8 flex justify-between text-xs text-white/60 font-semibold">
                      <span v-for="data in historyByYear" :key="data.year">
                        {{ data.year }}
                      </span>
                    </div>

                    <!-- Stats summary -->
                    <div class="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div class="text-xs text-white/40 mb-1">Meilleur</div>
                        <div class="text-cyan-400 font-bold">
                          {{ maxHistoryScore }}
                        </div>
                      </div>
                      <div>
                        <div class="text-xs text-white/40 mb-1">Moyenne</div>
                        <div class="text-white font-bold">
                          {{ averageHistoryScore }}
                        </div>
                      </div>
                      <div>
                        <div class="text-xs text-white/40 mb-1">Évolution</div>
                        <div 
                          :class="[
                            'font-bold flex items-center justify-center gap-1',
                            historyTrend === 'up' ? 'text-green-400' 
                              : historyTrend === 'down' ? 'text-red-400'
                                : 'text-white/60'
                          ]"
                        >
                          <Icon 
                            v-if="historyTrend === 'up'"
                            name="fluent:arrow-trending-up-24-filled" 
                            class="w-4 h-4" 
                          />
                          <Icon 
                            v-else-if="historyTrend === 'down'"
                            name="fluent:arrow-trending-down-24-filled" 
                            class="w-4 h-4" 
                          />
                          <Icon 
                            v-else
                            name="fluent:arrow-right-24-filled" 
                            class="w-4 h-4" 
                          />
                          {{ historyEvolutionValue }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Action -->
            <div class="p-6 border-t border-white/10 flex-shrink-0 bg-[#0B1120]/50 backdrop-blur-xl">
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
        </template>
      </div>
    </Transition>
  </Teleport>
</template>
