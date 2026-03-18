<script lang="ts">
import type { GroupDetailsResponse } from '../../types/api'
import { GROUP_DETAILS_CACHE_TTL } from '../../utils/timings'

// Cache en mémoire pour éviter les requêtes redondantes (ex: aller-retour rapide entre vue globale et détails).
const detailsCache = new Map<string, { data: GroupDetailsResponse; ts: number }>()
</script>

<script setup lang="ts">
import { PublicService } from '../../services/public.service'
//import { useSocket } from '../../composables/useSocket'
import { useFavoritesStore } from '../../stores/favorites'
//import type { PassageEnriched, HistoryEntry } from '../../types/api'
//import type { ScoreUpdatePayload } from '../../types/socket'

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

const { t } = useI18n()
const { translateCategory, translateApparatus } = useTranslatedData()
// ⚠️ DEAD CODE : const socket = useSocket()
const favoritesStore = useFavoritesStore()

const { now: nowTimestamp } = useNow()

const isLoading = ref(false)
const isTogglingFavorite = ref(false)
const error = ref<string | null>(null)
const details = ref<GroupDetailsResponse | null>(null)
const activeTab = ref<'timeline' | 'stats'>('timeline')

// Récupère les données avec possibilité de forcer le bypass du cache (ex: mise à jour websocket).
const fetchData = async (force = false) => {
  if (!props.groupId) return

  if (!force) {
    const cached = detailsCache.get(props.groupId)
    if (cached && Date.now() - cached.ts < GROUP_DETAILS_CACHE_TTL) {
      details.value = cached.data
      return
    }
  }

  isLoading.value = true
  error.value = null
  try {
    const data = await PublicService.fetchGroupDetails(props.groupId)
    details.value = data
    detailsCache.set(props.groupId, { data, ts: Date.now() })
  } catch (err) {
    console.error(err)
    error.value = t('group.loadError')
  } finally {
    isLoading.value = false
  }
}

const { version, apply, handleStatusUpdate, handleScoreUpdate, handleScheduleUpdate, reset } = useRealtimeStatus(() => fetchData(true))

// Réinitialise l'état et recharge les données lors de l'ouverture d'un nouveau groupe.
watch(() => props.isOpen, (newVal) => {
  if (newVal && props.groupId) {
    reset()
    fetchData()
    activeTab.value = 'timeline'
  }
})

watch(() => props.groupId, (newId) => {
  if (props.isOpen && newId) {
    reset()
    fetchData()
  }
})

// Construit une timeline fusionnant les données initiales avec les mises à jour temps réel des WebSockets.
const enrichedTimeline = computed(() => {
  if (!details.value?.timeline) return []
  
  // Cette dépendance force la réévaluation quand une mise à jour websocket est reçue.
  // ⚠️ DEAD CODE : const _v = version.value
  version.value 
  const now = nowTimestamp.value

  return details.value.timeline.map((item) => {
    const merged = apply(item)
    
    // Calcule le statut localement pour réagir au passage du temps sans attendre le serveur.
    const startTime = new Date(merged.startTime).getTime()
    const endTime = new Date(merged.endTime).getTime()
    const status = computePassageStatus(startTime, endTime, now, merged.status)

    return {
      ...merged,
      status
    }
  })
})

useSocketRoom(['live-scores', 'schedule-updates'], [
  { event: 'score-update', handler: handleScoreUpdate },
  { event: 'status-update', handler: handleStatusUpdate },
  { event: 'schedule-update', handler: handleScheduleUpdate }
])

// Recalcule les statistiques à la volée en se basant sur les données de la timeline enrichie.
const recomputeStats = () => {
   const finishedPassages = enrichedTimeline.value.filter((p) => p.status === 'FINISHED')
   const scoredPassages = finishedPassages.filter((p) => typeof p.score === 'number')
   
   const totalScore = scoredPassages.reduce((acc, curr) => acc + (curr.score || 0), 0)
   const finishedCount = finishedPassages.length
   const scoredCount = scoredPassages.length

   if (details.value) {
     details.value.stats = {
       ...details.value.stats,
       completedPassages: finishedCount,
       currentTotalScore: scoredCount > 0 ? Number((totalScore / scoredCount).toFixed(2)) : 0
     }
   }
}

watch(enrichedTimeline, () => {
  recomputeStats()
}, { deep: true })

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeydown)
  }
})

// ⚠️ DEAD CODE : const formatTime = (iso: string) => formatLocalizedTime(iso)

const groupPassageIds = computed(() => {
  if (!details.value?.timeline) return []
  return details.value.timeline.map((p) => p._id).filter(Boolean)
})

// L'état de favori global est vrai seulement si TOUS les passages du groupe sont marqués.
const isFavorite = computed(() => {
  return favoritesStore.areAllGroupPassagesFavorited(groupPassageIds.value)
})

const toggleFavorite = async () => {
  if (groupPassageIds.value.length > 0) {
    isTogglingFavorite.value = true
    try {
      await favoritesStore.toggleGroupFavorites(groupPassageIds.value)
    } finally {
      isTogglingFavorite.value = false
    }
  }
}

const getInitials = (name: string) => {
  if (!name) return ''
  return name.split(' ').map((n: string) => n[0]).join('')
}

const categoryLabel = computed(() => {
  if (!details.value?.info) return translateCategory('ACTIFS')
  return translateCategory(details.value.info.category)
})

const categoryColor = computed(() => {
  if (!details.value?.info) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  return details.value.info.category === 'MIXTE' 
    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
    : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
})

// Tente de récupérer le canton depuis la donnée structurée, sinon fallback via parsage du nom de la société.
const cantonDisplay = computed(() => {
  if (!details.value?.info) return null
  if (details.value.info.canton) return details.value.info.canton
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

// Agrége l'historique par année pour le graphique, avec un filtre optionnel par agrès.
const historyByYear = computed<HistoryPoint[]>(() => {
  if (!details.value?.history) return []

  let rawHistory = details.value.history

  if (props.apparatusCode) {
    rawHistory = rawHistory.filter(h => h.apparatus === props.apparatusCode)
  }

  const yearMap = new Map<number, { total: number; count: number }>()
  rawHistory.forEach(h => {
     if (!yearMap.has(h.year)) yearMap.set(h.year, { total: 0, count: 0 })
     const entry = yearMap.get(h.year)!
     entry.total += h.score
     entry.count++
  })

  const aggregated: HistoryPoint[] = Array.from(yearMap.entries()).map(([year, data]) => ({
    year,
    score: data.total / data.count
  }))

  return aggregated.sort((a, b) => a.year - b.year)
})

const averageHistoryScore = computed(() => {
  const list = historyByYear.value
  if (!list.length) return '0.00'
  const sum = list.reduce((acc: number, curr) => acc + (Number(curr.score) || 0), 0)
  return (sum / list.length).toFixed(2)
})

// ⚠️ DEAD CODE :
/*
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
  return Math.max(...list.map((d) => d.score ?? 0)).toFixed(2)
})
*/
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
        <div class="absolute top-3 right-3 z-[100]">
          <UiIconButton
            icon="fluent:dismiss-24-regular"
            variant="dark"
            :label="t('common.close')"
            @click="emit('close')"
          />
        </div>

        <div v-if="isLoading && !details" class="p-12 text-center text-white/60">
           <Icon name="fluent:spinner-ios-20-filled" class="w-8 h-8 animate-spin mx-auto mb-4" />
           <p>{{ t('group.loadingDashboard') }}</p>
        </div>

        <div v-else-if="error" class="p-12 text-center text-red-400">
           <Icon name="fluent:error-circle-24-regular" class="w-8 h-8 mx-auto mb-4" />
           <p>{{ error }}</p>
        </div>

        <template v-else-if="details">
            <div class="relative h-52 overflow-hidden flex-shrink-0">
              <ImageWithFallback
                :src="details.info.logo || 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2340&auto=format&fit=crop'"
                :alt="details.info.name"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0B1120]" />
              
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

            <div class="flex border-b border-white/10 bg-[#0B1120]/80 backdrop-blur-sm flex-shrink-0" role="tablist">
              <button
                @click="activeTab = 'timeline'"
                :class="[
                  'flex-1 py-4 px-6 font-semibold transition-colors relative focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none',
                  activeTab === 'timeline' ? 'text-cyan-400' : 'text-white/60 hover:text-white/80'
                ]"
                role="tab"
                :aria-selected="activeTab === 'timeline'"
                aria-controls="panel-timeline"
              >
                <Icon name="fluent:timeline-24-regular" class="w-5 h-5 inline-block mr-2" />
                {{ t('group.timeline') }}
                <div v-if="activeTab === 'timeline'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400" />
              </button>
              <button
                @click="activeTab = 'stats'"
                :class="[
                  'flex-1 py-4 px-6 font-semibold transition-colors relative focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none',
                  activeTab === 'stats' ? 'text-cyan-400' : 'text-white/60 hover:text-white/80'
                ]"
                role="tab"
                :aria-selected="activeTab === 'stats'"
                aria-controls="panel-stats"
              >
                <Icon name="fluent:data-bar-vertical-24-regular" class="w-5 h-5 inline-block mr-2" />
                {{ t('group.statistics') }}
                <div v-if="activeTab === 'stats'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto">
              <div v-show="activeTab === 'timeline'" class="p-6" id="panel-timeline" role="tabpanel">
                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div class="glass-card p-4 flex flex-col items-center justify-center bg-white/5">
                    <Icon name="fluent:checkmark-circle-24-regular" class="w-6 h-6 text-cyan-400 mb-2" />
                    <div class="text-2xl font-bold text-white leading-none mb-1">
                      {{ details.stats.completedPassages }} <span class="text-sm text-white/40 font-normal">/ {{ details.stats.totalPassages }}</span>
                    </div>
                    <div class="text-xs text-white/50">{{ t('group.completedPassages') }}</div>
                  </div>
                  <div class="glass-card p-4 flex flex-col items-center justify-center bg-white/5">
                    <Icon name="fluent:arrow-trending-24-regular" class="w-6 h-6 text-purple-400 mb-2" />
                    <div class="text-2xl font-bold text-white leading-none mb-1">{{ details.stats.currentTotalScore }}</div>
                    <div class="text-xs text-white/50">{{ t('group.averageScore') }}</div>
                  </div>
                </div>

                <h3 class="text-white font-bold mb-4 flex items-center gap-2">
                  <Icon name="fluent:calendar-clock-24-regular" class="w-5 h-5 text-cyan-400" />
                  {{ t('group.daySchedule') }}
                </h3>
                <div class="space-y-4 relative">
                  <div class="absolute left-[19px] top-2 bottom-2 w-0.5 bg-white/10" />

                  <GroupTimelineItem 
                    v-for="item in enrichedTimeline"
                    :key="item._id"
                    :item="item"
                  />
                </div>
              </div>

              <div v-show="activeTab === 'stats'" class="p-6 space-y-6" id="panel-stats" role="tabpanel">
                <div>
                  <h3 class="text-white font-bold mb-4 flex items-center gap-2">
                    <Icon name="fluent:data-bar-vertical-24-regular" class="w-5 h-5 text-cyan-400" />
                    {{ t('group.overview') }}
                  </h3>
                  <div class="grid grid-cols-3 gap-3">
                    <UiStatCard
                      icon="fluent:people-24-regular"
                      icon-color="text-cyan-400"
                      :value="gymnastsCount"
                      :label="t('group.gymnasts')"
                      bg-class="bg-white/5"
                    />
                    <UiStatCard
                      icon="fluent:person-24-regular"
                      icon-color="text-purple-400"
                      :value="monitorsCount"
                      :label="t('group.monitors')"
                      bg-class="bg-white/5"
                    />
                    <UiStatCard
                      icon="fluent:trophy-24-regular"
                      icon-color="text-cyan-400"
                      :value="averageHistoryScore"
                      :label="t('group.historyAvg')"
                      bg-class="bg-white/5"
                    />
                  </div>
                </div>

                <div v-if="details.info.category === 'MIXTE'" class="glass-card p-4 bg-purple-500/5 border border-purple-500/20">
                  <div class="flex items-start gap-3">
                    <Icon name="fluent:people-team-24-regular" class="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 class="text-white font-semibold text-sm mb-1">{{ t('group.mixedGroup') }}</h4>
                      <p class="text-white/60 text-xs">
                        {{ t('group.mixedGroupInfo') }}
                      </p>
                    </div>
                  </div>
                </div>

                <div v-if="monitors.length > 0">
                  <h3 class="text-white font-bold mb-3 flex items-center gap-2">
                    <Icon name="fluent:people-team-24-regular" class="w-5 h-5 text-cyan-400" />
                    {{ t('group.staffTeam') }}
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

                <div v-if="historyByYear.length > 0">
                  <div class="flex items-center gap-2 mb-3">
                    <Icon name="fluent:history-24-regular" class="w-5 h-5 text-cyan-400" />
                    <h3 class="text-white font-bold">{{ t('group.historicalPerformance') }}</h3>
                  </div>
                  <div class="glass-card p-5 bg-white/5">
                    <ChartsHistoryLineChart
                      :data="historyByYear"
                      :height="200"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <p v-if="groupPassageIds.length > 0" class="text-white/50 text-xs text-center mt-2">
              {{ t('group.passagesInGroup', { count: groupPassageIds.length }, groupPassageIds.length) }}
            </p>
            
            <div class="p-6 border-t border-white/10 flex-shrink-0 bg-[#0B1120]/50 backdrop-blur-xl">
              <UiButton
                @click="toggleFavorite"
                :loading="isTogglingFavorite"
                variant="primary"
                block
                rounded="xl"
                class="gradient-cyan-purple border-none shadow-purple-500/20 py-3.5 text-white font-bold"
                :icon="isFavorite ? 'fluent:heart-24-filled' : 'fluent:heart-24-regular'"
              >
                {{ isTogglingFavorite ? t('common.loading') : (isFavorite ? t('group.removeFromFavorites') : t('group.addToFavorites')) }}
              </UiButton>
            </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>
