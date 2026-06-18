<script setup lang="ts">
import { PublicService } from '~/services/public.service'
import { useFavoritesStore } from '~/stores/favorites'
import { storeToRefs } from 'pinia'
import type { PassageEnriched } from '~/types/api'
import CascadeSkeletonList from '~/components/loading/CascadeSkeletonList.vue'
import {
  FAVORITES_AUTO_REFRESH
} from '~/utils/timings'

const { t } = useI18n()
const { translateApparatus, formatLocalizedTime, formatLocalizedDate } = useTranslatedData()
const { open: openGroupDetails } = useGroupDetails()
const favoritesStore = useFavoritesStore()
const { favorites } = storeToRefs(favoritesStore)

// Fetch Schedule (unique key to avoid sharing cached data with schedule page)
const { data: scheduleData, pending, refresh: refreshSchedule } = await PublicService.getSchedule(undefined, { key: 'favorites-schedule' })
const hasLoadedOnce = ref(false)

// ─── Realtime status overrides (same pattern as schedule.vue) ───
const { version, apply, handleStatusUpdate, handleScheduleUpdate, handleScoreUpdate, reset } = useRealtimeStatus(refreshSchedule)

watch([pending, scheduleData], ([isPending, data]) => {
  if (!isPending && data) {
    hasLoadedOnce.value = true
    reset()
  }
}, { immediate: true })

const showSkeleton = computed(() => !hasLoadedOnce.value)

// 1. Compute favorite passages (with overrides applied)
const favoritePassages = computed<PassageEnriched[]>(() => {
  const _v = version.value // reactive dep on overrides
  if (!scheduleData.value?.data) return []
  return scheduleData.value.data
    .filter((p: any) => p._id && favorites.value.includes(p._id))
    .map(apply)
    // Note: sorting is done in usePassageTiming for upcoming/past lists
})

// 2. Use composable
const { upcomingPassages, pastPassages, nextEvent, timeToNext } = usePassageTiming(favoritePassages)

// PWA fallback: periodic auto-refresh + foreground refresh
useAutoRefresh(refreshSchedule, FAVORITES_AUTO_REFRESH, () => {
  reset()
  refreshSchedule()
})

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
              <FavoritePassageCard
                v-for="passage in upcomingPassages"
                :key="passage._id"
                :passage="passage"
                @click:group="handleGroupClick"
                @toggle:favorite="toggleFavorite"
              />
            </TransitionGroup>
          </div>
        </ClientOnly>

        <!-- Past Events List -->
        <ClientOnly>
          <div v-if="pastPassages.length > 0">
            <h3 class="text-white text-lg font-bold mb-4 px-1">{{ t('favorites.pastEvents') }}</h3>
            <TransitionGroup name="list" tag="div" class="space-y-3 relative">
              <FavoritePassageCard
                v-for="passage in pastPassages"
                :key="passage._id"
                :passage="passage"
                :is-past="true"
                @click:group="handleGroupClick"
                @toggle:favorite="toggleFavorite"
              />
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
