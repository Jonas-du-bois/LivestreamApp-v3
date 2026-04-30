<script lang="ts">
import type { GroupDetailsResponse } from '../../types/api'
import { GROUP_DETAILS_CACHE_TTL } from '../../utils/timings'

// Cache en mémoire pour éviter les requêtes redondantes (ex: aller-retour rapide entre vue globale et détails).
const detailsCache = new Map<string, { data: GroupDetailsResponse; ts: number }>()
</script>

<script setup lang="ts">
import { PublicService } from '../../services/public.service'
import { useFavoritesStore } from '../../stores/favorites'

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
const { translateCategory } = useTranslatedData()
const favoritesStore = useFavoritesStore()

const { now: nowTimestamp } = useNow()

const isLoading = ref(false)
const isTogglingFavorite = ref(false)
const error = ref<string | null>(null)
const details = ref<GroupDetailsResponse | null>(null)

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
  if (name && name.includes(':')) return name.split(':')[0].trim()
  return null
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
                :src="details.info.logo || '/img/group-fallback.png'"
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

            <div class="flex-1 overflow-y-auto">
              <div class="p-6">
                <div v-if="details.info.category === 'MIXTE'" class="glass-card p-4 bg-purple-500/5 border border-purple-500/20 mb-6">
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
