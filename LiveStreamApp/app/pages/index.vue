<script setup lang="ts">
import { PublicService } from '../services/public.service'
import HomeQuickActionButton from '~/components/home/HomeQuickActionButton.vue'
import CascadeSkeletonList from '~/components/loading/CascadeSkeletonList.vue'

const { t } = useI18n()
const { translateApparatus } = useTranslatedData()

interface Group {
  id: string
  name: string
  apparatus: string
  apparatusCode?: string
  salle: string
  category?: string
  streamId?: string
}

type QuickActionAccent = 'cyan' | 'emerald' | 'pink' | 'orange' | 'violet'

interface QuickAction {
  id: string
  to: string
  label: string
  icon: string
  accent: QuickActionAccent
  badge?: string | null
}

const openGroupDetails = inject<(groupId: string, apparatusCode?: string) => void>('openGroupDetails')

// Fetch live passages to populate "En piste maintenant"
const { data: liveResp, pending: livePending, refresh: refreshLive } = await PublicService.getLive()

const happeningNow = computed<Group[]>(() => {
  return (liveResp.value?.passages || []).map((p: any) => {
    // Find stream for this passage
    const stream = (liveResp.value?.streams || []).find((s: any) => {
      if (!s.currentPassage) return false
      if (typeof s.currentPassage === 'string') return s.currentPassage === p._id
      return s.currentPassage?._id === p._id
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

const showHappeningNowSkeleton = computed(() => livePending.value && !hasLiveLoadedOnce.value)

// First live passage (used for hero)
const firstLivePassage = computed<any>(() => {
  return (liveResp.value?.passages && liveResp.value.passages.length > 0) ? liveResp.value.passages[0] : null
})

const heroTitle = computed(() => firstLivePassage.value?.group?.name || 'FSG Yverdon')
const heroSubtitle = computed(() => {
  if (!firstLivePassage.value) return 'Salle 1 • Sol'
  const loc = firstLivePassage.value.location || '—'
  const app = translateApparatus(firstLivePassage.value.apparatus?.code, firstLivePassage.value.apparatus?.name)
  return `${loc} • ${app}`
})

const firstLiveStream = computed(() => {
  const p = firstLivePassage.value
  if (!p) return null
  const streams = liveResp.value?.streams || []
  return streams.find((s: any) => {
    if (!s.currentPassage) return false
    if (typeof s.currentPassage === 'string') return s.currentPassage === p._id
    return s.currentPassage?._id === p._id
  })
})

const heroImage = computed(() => {
  const defaultImg = 'https://images.unsplash.com/photo-1764622078388-df36863688d3?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  const s = firstLiveStream.value

  // Try to extract YouTube id if present to use a thumbnail
  if (s?.url && s.url.includes('youtube')) {
    const m = s.url.match(/embed\/([a-zA-Z0-9_-]{11})/)
    if (m && m[1]) return `https://img.youtube.com/vi/${m[1]}/maxresdefault.jpg`
  }

  return defaultImg
})

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
    id: 'weather',
    to: '/weather',
    label: t('home.weather'),
    icon: 'fluent:weather-partly-cloudy-day-24-regular',
    accent: 'cyan',
    badge: weatherBadge.value
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
  }
])

const handleGroupClick = (groupId: string, apparatusCode?: string) => {
  openGroupDetails?.(groupId, apparatusCode)
}

// Handle real-time updates
const handleScheduleUpdate = () => refreshLive()
const handleStatusUpdate = () => refreshLive()

// Use the composable for proper socket room management
useSocketRoom('schedule-updates', [
  { event: 'schedule-update', handler: handleScheduleUpdate },
  { event: 'status-update', handler: handleStatusUpdate }
])
</script>

<template>
  <div class="px-4 space-y-6 pb-6">
    <Transition name="premium-swap" mode="out-in">
      <div v-if="showHappeningNowSkeleton && !hasLiveLoadedOnce" key="home-loading" class="space-y-6">
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
        <!-- Hero Live Card -->
        <NuxtLink
          v-if="firstLiveStream"
          :to="'/stream/' + firstLiveStream._id"
          class="glass-card overflow-hidden relative h-64 cursor-pointer active:scale-[0.98] transition-transform block focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none rounded-xl"
        >
          <ImageWithFallback
            :src="heroImage"
            :alt="heroTitle"
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 gradient-overlay" />

          <div class="absolute bottom-0 left-0 right-0 p-6">
            <div class="flex items-center gap-2 mb-3">
              <div v-if="firstLivePassage" class="flex items-center gap-2 bg-red-500/90 px-3 py-1.5 rounded-full">
                <span class="w-2 h-2 bg-white rounded-full animate-pulse-glow" />
                <span class="text-white text-sm font-medium">{{ t('home.live') }}</span>
              </div>
            </div>

            <h2 class="text-white text-2xl font-bold mb-1">{{ heroTitle }}</h2>
            <p class="text-white/80">{{ heroSubtitle }}</p>
          </div>
        </NuxtLink>

        <div 
          v-else
          class="glass-card overflow-hidden relative h-64 cursor-pointer active:scale-[0.98] transition-transform block focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none rounded-xl"
          @click="firstLivePassage?.group?._id ? handleGroupClick(firstLivePassage.group._id, firstLivePassage.apparatus?.code) : undefined"
          role="button"
          tabindex="0"
          :aria-label="t('results.openGroupDetails', { group: heroTitle })"
          @keydown.enter="firstLivePassage?.group?._id ? handleGroupClick(firstLivePassage.group._id, firstLivePassage.apparatus?.code) : undefined"
          @keydown.space.prevent="firstLivePassage?.group?._id ? handleGroupClick(firstLivePassage.group._id, firstLivePassage.apparatus?.code) : undefined"
        >
          <ImageWithFallback 
            :src="heroImage"
            :alt="heroTitle"
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 gradient-overlay" />
          
          <div class="absolute bottom-0 left-0 right-0 p-6">
            <div class="flex items-center gap-2 mb-3">
              <div v-if="firstLivePassage" class="flex items-center gap-2 bg-red-500/90 px-3 py-1.5 rounded-full">
                <span class="w-2 h-2 bg-white rounded-full animate-pulse-glow" />
                <span class="text-white text-sm font-medium">{{ t('home.live') }}</span>
              </div>
            </div>
            
            <h2 class="text-white text-2xl font-bold mb-1">{{ heroTitle }}</h2>
            <p class="text-white/80">{{ heroSubtitle }}</p>
          </div>
        </div>

        <!-- Happening Now Carousel -->
        <div>
          <h3 class="text-white text-lg font-bold mb-4 px-1">{{ t('home.happeningNow') }}</h3>
          <div class="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            <div 
              v-for="group in happeningNow"
              :key="group.id"
              class="glass-card p-4 min-w-[200px] flex-shrink-0 cursor-pointer hover:bg-white/15 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none rounded-xl"
              @click="handleGroupClick(group.id, group.apparatusCode)"
              role="button"
              tabindex="0"
              :aria-label="t('results.openGroupDetails', { group: group.name })"
              @keydown.enter="handleGroupClick(group.id, group.apparatusCode)"
              @keydown.space.prevent="handleGroupClick(group.id, group.apparatusCode)"
            >
              <div class="text-cyan-400 text-sm mb-2">{{ group.salle }}</div>
              <h4 class="text-white font-bold mb-1">{{ group.name }}</h4>
              <p class="text-white/60 text-sm">{{ group.apparatus }}</p>
              
              <NuxtLink
                v-if="group.streamId"
                :to="`/stream/${group.streamId}`"
                @click.stop
                class="mt-3 w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              >
                <Icon name="fluent:play-24-filled" class="w-4 h-4" />
                <span class="text-sm">{{ t('common.watch') }}</span>
              </NuxtLink>
            </div>
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
