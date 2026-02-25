<script setup lang="ts">
import { PublicService } from '~/services/public.service'
import { useFavoritesStore } from '~/stores/favorites'
import { storeToRefs } from 'pinia'
import type { PassageEnriched } from '~/types/api'
import CascadeSkeletonList from '~/components/loading/CascadeSkeletonList.vue'
import {
  FAVORITES_AUTO_REFRESH,
  COUNTDOWN_TICK,
  STATUS_OVERRIDE_DEFER
} from '~/utils/timings'

const { t } = useI18n()
const { translateApparatus, formatLocalizedTime, formatLocalizedDate } = useTranslatedData()
const { open: openGroupDetails } = useGroupDetails()
const favoritesStore = useFavoritesStore()
const { favorites } = storeToRefs(favoritesStore)

// Fetch Schedule
const { data: scheduleData, pending, refresh: refreshSchedule } = await PublicService.getSchedule()
const hasLoadedOnce = ref(false)

// ─── Realtime status overrides (same pattern as schedule.vue) ───
const statusOverrides = new Map<string, { status: string; score?: number | null }>()
const statusVersion = ref(0)

watch([pending, scheduleData], ([isPending, data]) => {
  if (!isPending && data) {
    hasLoadedOnce.value = true
    statusOverrides.clear()
    statusVersion.value++
  }
}, { immediate: true })

const showSkeleton = computed(() => !hasLoadedOnce.value)

// Helper to apply overrides to a passage
const applyOverride = (p: any) => {
  const override = statusOverrides.get(p._id)
  if (override) {
    return {
      ...p,
      status: override.status,
      ...(override.score !== undefined ? { score: override.score } : {})
    }
  }
  return p
}

const favoritePassages = computed<PassageEnriched[]>(() => {
  const _v = statusVersion.value // reactive dep on overrides
  if (!scheduleData.value?.data) return []
  return scheduleData.value.data
    .filter((p: any) => p._id && favorites.value.includes(p._id))
    .map(applyOverride)
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

// Separate upcoming and past events
const upcomingPassages = computed<PassageEnriched[]>(() => {
  const now = new Date()
  return favoritePassages.value.filter(p => new Date(p.startTime) > now)
})

const pastPassages = computed<PassageEnriched[]>(() => {
  const now = new Date()
  return favoritePassages.value
    .filter(p => new Date(p.startTime) <= now)
    .reverse() // Most recent first
})

// Next Event Countdown Logic
const nextEvent = computed(() => {
  const now = new Date()
  return favoritePassages.value.find(p => new Date(p.startTime) > now)
})

const timeToNext = ref('')

const updateTimer = () => {
  if (!nextEvent.value) {
    timeToNext.value = ''
    return
  }
  const now = new Date().getTime()
  const target = new Date(nextEvent.value.startTime).getTime()
  const diff = target - now

  if (diff <= 0) {
    timeToNext.value = t('favorites.inProgress')
    return
  }

  const totalSeconds = Math.floor(diff / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  if (h === 0 && m === 0) {
    timeToNext.value = `${s}s`
  } else if (h === 0) {
    if (m < 2) {
      timeToNext.value = `${m}m ${s}s`
    } else {
      timeToNext.value = `${m}m`
    }
  } else {
    timeToNext.value = `${h}h ${m}m`
  }
}

let timer: any = null
let autoRefreshTimer: any = null

onMounted(() => {
  updateTimer()
  timer = setInterval(updateTimer, COUNTDOWN_TICK)
  // PWA fallback: periodic auto-refresh
  autoRefreshTimer = setInterval(() => refreshSchedule(), FAVORITES_AUTO_REFRESH)
  // PWA: refresh on foreground
  if (import.meta.client) {
    document.addEventListener('visibilitychange', handleVisibility)
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (autoRefreshTimer) clearInterval(autoRefreshTimer)
  if (import.meta.client) {
    document.removeEventListener('visibilitychange', handleVisibility)
  }
})

const handleVisibility = () => {
  if (document.visibilityState === 'visible') {
    statusOverrides.clear()
    statusVersion.value++
    refreshSchedule()
  }
}

const formatTime = (dateStr: string) => {
  return formatLocalizedTime(dateStr)
}

const formatDate = (dateStr: string) => {
  return formatLocalizedDate(dateStr, { weekday: 'long', day: 'numeric' })
}

const toggleFavorite = (passageId: string, event: Event) => {
  event.stopPropagation()
  favoritesStore.toggleFavorite(passageId)
}

const handleGroupClick = (groupId: string) => {
  openGroupDetails(groupId)
}

// ─── Socket handlers ─────────────────────────────────────────────
const handleScoreUpdate = (data: any) => {
  if (!data?.passageId) return
  const existing = statusOverrides.get(data.passageId)
  statusOverrides.set(data.passageId, {
    status: data.status || existing?.status || 'FINISHED',
    score: data.score ?? existing?.score
  })
  statusVersion.value++
}

let statusDeferTimer: ReturnType<typeof setTimeout> | null = null

const handleStatusUpdate = (payload: { passageId?: string; status?: string; score?: number | null }) => {
  console.log('[Favorites] status-update:', payload)
  if (payload?.passageId && payload?.status) {
    statusOverrides.set(payload.passageId, {
      status: payload.status,
      ...(payload.score !== undefined ? { score: payload.score } : {})
    })
    statusVersion.value++
  }
  // Debounced deferred sync: cascading events (FINISHED + auto-LIVE) are batched
  if (statusDeferTimer) clearTimeout(statusDeferTimer)
  statusDeferTimer = setTimeout(() => {
    statusOverrides.clear()
    statusVersion.value++
    refreshSchedule()
    statusDeferTimer = null
  }, STATUS_OVERRIDE_DEFER)
}

const handleScheduleUpdate = () => {
  console.log('[Favorites] schedule-update → refresh')
  statusOverrides.clear()
  statusVersion.value++
  refreshSchedule()
}

// Use the composable for proper socket room management
useSocketRoom(['live-scores', 'schedule-updates'], [
  { event: 'score-update', handler: handleScoreUpdate },
  { event: 'status-update', handler: handleStatusUpdate },
  { event: 'schedule-update', handler: handleScheduleUpdate }
])
</script>

<template>
  <div class="px-4 space-y-6 pb-6">
    <Transition name="premium-swap" mode="out-in">
      <CascadeSkeletonList
        v-if="showSkeleton"
        key="favorites-skeleton"
        :count="6"
        layout="vertical"
        :aria-label="t('common.loading')"
      >
        <template #default>
          <UiSkeletonCard
            layout="time"
            content="text"
            action="circle"
            align="center"
          />
        </template>
      </CascadeSkeletonList>

      <div v-else key="favorites-content" class="space-y-6">
        <!-- Next Event Card -->
        <ClientOnly>
          <div v-if="nextEvent" class="glass-card p-6 relative overflow-hidden">
            <div class="absolute top-0 right-0 p-4 opacity-10">
              <Icon name="fluent:timer-24-filled" class="w-24 h-24" />
            </div>

            <p class="text-white/60 text-sm mb-2">{{ t('favorites.nextFavorite') }}</p>
            <div class="flex items-baseline gap-2 mb-4">
              <h2 class="text-4xl font-bold text-white">{{ timeToNext }}</h2>
            </div>

            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-cyan-400/20 flex items-center justify-center">
                 <Icon v-if="nextEvent.apparatus?.icon" :name="nextEvent.apparatus.icon" class="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 class="text-white font-bold">{{ nextEvent.group?.name }}</h3>
                <p class="text-white/60 text-sm">{{ translateApparatus(nextEvent.apparatus?.code, nextEvent.apparatus?.name) }} • {{ nextEvent.location }}</p>
              </div>
            </div>
          </div>
        </ClientOnly>

        <!-- Upcoming Events List -->
        <ClientOnly>
          <div v-if="upcomingPassages.length > 0">
            <h3 class="text-white text-lg font-bold mb-4 px-1">{{ t('favorites.mySchedule') }}</h3>
            <TransitionGroup name="list" tag="div" class="space-y-3 relative">
              <UiGlassCard
                v-for="passage in upcomingPassages"
                :key="passage._id"
                class="flex items-center gap-4"
                :interactive="true"
                @click="handleGroupClick(passage.group?._id || '')"
              >
                <div class="text-center min-w-[60px]">
                   <div class="text-cyan-400 font-bold text-lg">{{ formatTime(passage.startTime) }}</div>
                   <div class="text-white/40 text-xs uppercase">{{ formatDate(passage.startTime).split(' ')[0] }}</div>
                </div>

                <div class="flex-1 min-w-0">
                  <h4 class="text-white font-bold mb-1">{{ passage.group?.name }}</h4>
                  <div class="flex items-center gap-2 text-sm">
                     <span class="text-white/60">{{ passage.location }}</span>
                     <span class="text-white/40">•</span>
                     <span class="text-purple-400">{{ translateApparatus(passage.apparatus?.code, passage.apparatus?.name) }}</span>
                  </div>
                </div>

                <div class="flex items-start pt-0.5 flex-shrink-0">
                  <SparkHeart
                    :active="true"
                    :label="t('favorites.removeFromFavorites', { name: passage.group?.name || '' })"
                    @click.stop="passage._id && toggleFavorite(passage._id, $event)"
                  />
                </div>
              </UiGlassCard>
            </TransitionGroup>
          </div>
        </ClientOnly>

        <!-- Past Events List -->
        <ClientOnly>
          <div v-if="pastPassages.length > 0">
            <h3 class="text-white text-lg font-bold mb-4 px-1">{{ t('favorites.pastEvents') }}</h3>
            <TransitionGroup name="list" tag="div" class="space-y-3 relative">
              <UiGlassCard
                v-for="passage in pastPassages"
                :key="passage._id"
                class="flex items-center gap-4 opacity-70"
                :interactive="true"
                @click="handleGroupClick(passage.group?._id || '')"
              >
                <div class="text-center min-w-[60px]">
                   <div class="text-cyan-400 font-bold text-lg">{{ formatTime(passage.startTime) }}</div>
                   <div class="text-white/40 text-xs uppercase">{{ formatDate(passage.startTime).split(' ')[0] }}</div>
                </div>

                <div class="flex-1 min-w-0">
                  <h4 class="text-white font-bold mb-1">{{ passage.group?.name }}</h4>
                  <div class="flex items-center gap-2 text-sm">
                     <span class="text-white/60">{{ passage.location }}</span>
                     <span class="text-white/40">•</span>
                     <span class="text-purple-400">{{ translateApparatus(passage.apparatus?.code, passage.apparatus?.name) }}</span>
                  </div>
                </div>

                <div class="flex items-start pt-0.5 flex-shrink-0">
                  <SparkHeart
                    :active="true"
                    :label="t('favorites.removeFromFavorites', { name: passage.group?.name || '' })"
                    @click.stop="passage._id && toggleFavorite(passage._id, $event)"
                  />
                </div>
              </UiGlassCard>
            </TransitionGroup>
          </div>
        </ClientOnly>

        <!-- Empty State -->
        <ClientOnly>
          <UiEmptyState
            v-if="favoritePassages.length === 0"
            class="mt-10"
            :title="t('favorites.noFavorites')"
            :description="t('favorites.noFavoritesHint')"
            icon="fluent:heart-broken-24-regular"
          >
            <template #actions>
              <NuxtLink
                to="/schedule"
                class="bg-cyan-400 text-[#0B1120] px-6 py-3 rounded-xl font-bold transition-all hover:bg-cyan-300 active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-[#0B1120] outline-none"
              >
                {{ t('favorites.browseSchedule') }}
              </NuxtLink>
            </template>
          </UiEmptyState>
        </ClientOnly>
      </div>
    </Transition>
  </div>
</template>
