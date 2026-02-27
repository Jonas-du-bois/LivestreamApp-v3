<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { PublicService } from '~/services/public.service'
import { useSocketRoom } from '~/composables/useSocketRoom'
import { HOME_AUTO_REFRESH } from '~/utils/timings'
import type { PassageEnriched, Stream, Passage } from '~/types/api'

const { t } = useI18n()
const { translateApparatus, translateCategory } = useTranslatedData()

interface HappeningNowItem {
  id: string
  name: string
  apparatus: string
  apparatusCode?: string
  salle: string
  streamId?: string
}

interface QuickAction {
  id: string
  to: string
  label: string
  icon: string
  accent: 'cyan' | 'emerald' | 'pink' | 'orange' | 'violet'
  badge?: string | null
}

const { open: openGroupDetails } = useGroupDetails()

// Fetch live passages to populate "En piste maintenant"
const { data: liveResp, pending: livePending, refresh: refreshLive } = await PublicService.getLive()

const happeningNow = computed<HappeningNowItem[]>(() => {
  return (liveResp.value?.passages || []).map((p: PassageEnriched) => {
    // Find stream for this passage
    const stream = (liveResp.value?.streams || []).find((s: Stream) => {
      if (!s.currentPassage) return false
      if (typeof s.currentPassage === 'string') return s.currentPassage === p._id
      return (s.currentPassage as Passage)._id === p._id
    })

    return {
      id: p.group?._id,
      name: p.group?.name || t('common.unknown'),
      apparatus: translateApparatus(p.apparatus?.code, p.apparatus?.name),
      apparatusCode: p.apparatus?.code,
      salle: p.location || '',
      category: '',
      streamId: stream?._id
    }
  })
})

const hasLiveLoadedOnce = ref(false)

watch([livePending, liveResp], ([isPending, response]) => {
  if (!isPending && response) {
    hasLiveLoadedOnce.value = true
  }
}, { immediate: true })

const showHappeningNowSkeleton = computed(() => !hasLiveLoadedOnce.value)

// Weather (Yverdon-les-Bains)
const { data: weatherResp, pending: weatherPending } = await PublicService.getWeather()

const weatherBadge = computed(() => {
  if (weatherPending.value) return '--'
  if (weatherResp.value && typeof weatherResp.value.temperature === 'number') {
    return `${Math.round(weatherResp.value.temperature)}°`
  }
  return '—'
})

const quickActions = computed<QuickAction[]>(() => [
  {
    id: 'infos',
    to: '/infos',
    label: t('home.info'),
    icon: 'fluent:info-24-regular',
    accent: 'emerald'
  },
  {
    id: 'photos',
    to: '/photos',
    label: t('home.photos'),
    icon: 'fluent:camera-sparkles-24-regular',
    accent: 'cyan'
  },
  {
    id: 'food',
    to: '/food',
    label: t('home.restaurant'),
    icon: 'fluent:food-24-regular',
    accent: 'orange'
  },
  {
    id: 'plan',
    to: '/plan',
    label: t('home.plan'),
    icon: 'fluent:location-24-regular',
    accent: 'violet'
  },
  {
    id: 'afterparty',
    to: '/afterparty',
    label: t('home.afterParty'),
    icon: 'fluent:drink-beer-24-regular',
    accent: 'pink'
  },
  {
    id: 'weather',
    to: '/weather',
    label: t('home.weather'),
    icon: 'fluent:weather-partly-cloudy-day-24-regular',
    accent: 'cyan',
    badge: weatherBadge.value
  }
])

const router = useRouter()

const handleGroupClick = (groupId: string, apparatusCode?: string) => {
  openGroupDetails?.(groupId, apparatusCode)
}

// Navigation explicite vers un stream – plus fiable que le prop :to en cascade
const navigateToStream = (streamId: string) => {
  router.push(`/stream/${streamId}`)
}

const handleTileClick = (group: { id: string; streamId?: string; apparatusCode?: string }) => {
  if (group.streamId) {
    navigateToStream(group.streamId)
  } else {
    handleGroupClick(group.id, group.apparatusCode)
  }
}

// ─── Real-time + PWA resilience ──────────────────────────────────
const handleScheduleUpdate = () => {
  console.log('[Home] schedule-update → refreshLive')
  refreshLive()
}
const handleStatusUpdate = () => {
  console.log('[Home] status-update → refreshLive')
  refreshLive()
}

// PWA fallback: periodic auto-refresh + foreground refresh
useAutoRefresh(refreshLive, HOME_AUTO_REFRESH)

// Use the composable for proper socket room management
useSocketRoom('schedule-updates', [
  { event: 'schedule-update', handler: handleScheduleUpdate },
  { event: 'status-update', handler: handleStatusUpdate }
])
</script>

<template>
  <div class="px-4 space-y-6 pb-6">
    <Transition name="premium-swap" mode="out-in">
      <div v-if="showHappeningNowSkeleton" key="home-loading" class="space-y-6">
        <!-- Hero Skeleton -->
        <div class="glass-card overflow-hidden relative h-64 rounded-xl premium-skeleton-shimmer premium-skeleton-surface opacity-50"></div>
        
        <!-- Carousel Skeleton -->
        <div>
          <div class="premium-skeleton-line premium-skeleton-shimmer h-6 w-40 mb-4 px-1"></div>
          <div class="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            <div v-for="i in 3" :key="i" class="glass-card p-4 min-w-[200px] h-[138px] premium-skeleton-surface premium-skeleton-shimmer opacity-50 rounded-xl"></div>
          </div>
        </div>
      </div>

      <div v-else key="home-content" class="space-y-6">
        <!-- Hero Carousel Section -->
        <HomeHeroCarousel 
          :live-passages="liveResp?.passages"
          :live-streams="liveResp?.streams"
          :loading="livePending"
        />

        <!-- Happening Now Carousel -->
        <div>
          <UiSectionTitle class="mb-4">{{ t('home.happeningNow') }}</UiSectionTitle>
          <div class="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            <UiGlassCard
              v-for="group in happeningNow"
              :key="group.id"
              class="min-w-[200px] flex-shrink-0"
              :interactive="true"
              :aria-label="group.streamId ? t('stream.openStream') : t('results.openGroupDetails', { group: group.name })"
              @click="handleTileClick(group)"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="text-cyan-400 text-sm">{{ group.salle }}</div>
                <Icon v-if="group.streamId" name="fluent:play-24-filled" class="w-4 h-4 text-cyan-400" />
              </div>
              <h4 class="text-white font-bold mb-1 truncate">{{ group.name }}</h4>
              <p class="text-white/60 text-sm truncate">{{ group.apparatus }}</p>
            </UiGlassCard>
          </div>
        </div>

        <!-- Info Tiles -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 auto-rows-fr">
          <HomeQuickActionButton
            v-for="action in quickActions"
            :key="action.id"
            :to="action.to"
            :label="action.label"
            :icon="action.icon"
            :accent="action.accent"
            :badge="action.badge ?? null"
            :aria-label="action.label"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>
