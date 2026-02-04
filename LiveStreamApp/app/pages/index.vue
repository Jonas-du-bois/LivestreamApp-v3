<script setup lang="ts">
import { PublicService } from '../services/public.service'
import { useSocket } from '../composables/useSocket'

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

const openGroupDetails = inject<(groupId: string, apparatusCode?: string) => void>('openGroupDetails')

// Fetch live passages to populate "En piste maintenant"
const { data: liveResp, refresh: refreshLive } = await PublicService.getLive()

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
const { data: weatherResp, pending: weatherPending, refresh: refreshWeather } = await PublicService.getWeather()

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
    <!-- Hero Live Card -->
    <NuxtLink
      v-if="firstLiveStream"
      :to="'/stream/' + firstLiveStream._id"
      class="glass-card overflow-hidden relative h-64 cursor-pointer active:scale-[0.98] transition-transform block"
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
      class="glass-card overflow-hidden relative h-64 cursor-pointer active:scale-[0.98] transition-transform block"
      @click="firstLivePassage?.group?._id ? handleGroupClick(firstLivePassage.group._id, firstLivePassage.apparatus?.code) : undefined"
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
          class="glass-card p-4 min-w-[200px] flex-shrink-0 cursor-pointer hover:bg-white/15 active:scale-[0.98] transition-all"
          @click="handleGroupClick(group.id, group.apparatusCode)"
        >
          <div class="text-cyan-400 text-sm mb-2">{{ group.salle }}</div>
          <h4 class="text-white font-bold mb-1">{{ group.name }}</h4>
          <p class="text-white/60 text-sm">{{ group.apparatus }}</p>
          
          <NuxtLink
            v-if="group.streamId"
            :to="`/stream/${group.streamId}`"
            @click.stop
            class="mt-3 w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Icon name="fluent:play-24-filled" class="w-4 h-4" />
            <span class="text-sm">{{ t('common.watch') }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Info Tiles -->
    <div class="grid grid-cols-3 gap-3">
      <div class="glass-card p-4 flex flex-col items-center text-center">
        <div class="w-12 h-12 rounded-full bg-cyan-400/20 flex items-center justify-center mb-3">
          <Icon name="fluent:weather-partly-cloudy-day-24-regular" class="w-6 h-6 text-cyan-400" />
        </div>
        <span class="text-white/80 text-sm">{{ t('home.weather') }}</span>
        <span class="text-white font-bold mt-1">
          <template v-if="weatherPending">--</template>
          <template v-else-if="weatherResp && typeof weatherResp.temperature === 'number'">{{ Math.round(weatherResp.temperature) }}°C</template>
          <template v-else>—</template>
        </span>
      </div>

      <!-- button quick access map and food -->
      <NuxtLink to="/plan" class="glass-card p-4 flex flex-col items-center text-center hover:bg-white/10 transition-colors rounded-lg">
        <div class="w-12 h-12 rounded-full bg-purple-400/20 flex items-center justify-center mb-3">
          <Icon name="fluent:location-24-regular" class="w-6 h-6 text-purple-400" />
        </div>
        <span class="text-white/80 text-sm">{{ t('home.plan') }}</span>
      </NuxtLink>
      
      <NuxtLink to="/food" class="glass-card p-4 flex flex-col items-center text-center hover:bg-white/10 transition-colors rounded-lg">
        <div class="w-12 h-12 rounded-full bg-cyan-400/20 flex items-center justify-center mb-3">
          <Icon name="fluent:food-24-regular" class="w-6 h-6 text-cyan-400" />
        </div>
        <span class="text-white/80 text-sm">{{ t('home.restaurant') }}</span>
      </NuxtLink>
    </div>
  </div>
</template>
