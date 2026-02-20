<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import CascadeSkeletonList from '~/components/loading/CascadeSkeletonList.vue'

const { t } = useI18n()
const { translateApparatus } = useTranslatedData()

interface StreamDisplay {
  id: string
  title: string
  thumbnail?: string
  isLive: boolean
  salle?: string
  currentGroup?: string
  currentApparatus?: string
  currentApparatusCode?: string
}

// Use refs for reactive data that updates in real-time
const liveData = ref<{ passages: any[]; streams: any[] } | null>(null)
const allStreamsData = ref<any[] | null>(null)
const loading = ref(true)
const hasLoadedOnce = ref(false)

const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string

// Fetch functions using $fetch for real-time updates
const fetchLive = async () => {
  try {
    liveData.value = await $fetch<{ passages: any[]; streams: any[] }>('/live', { baseURL: apiBase })
    console.log('[stream/index] Live data fetched:', liveData.value?.streams?.length, 'streams')
  } catch (err) {
    console.error('[stream/index] Error fetching live:', err)
  }
}

const fetchStreams = async () => {
  try {
    allStreamsData.value = await $fetch<any[]>('/streams', { baseURL: apiBase })
    console.log('[stream/index] All streams fetched:', allStreamsData.value?.length)
  } catch (err) {
    console.error('[stream/index] Error fetching streams:', err)
  }
}

// Initial fetch
onMounted(async () => {
  try {
    await Promise.all([fetchLive(), fetchStreams()])
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
})

const showSkeleton = computed(() => loading.value && !hasLoadedOnce.value)

// Build a map of live passages by LOCATION for quick lookup
const livePassagesByLocation = computed(() => {
  const map = new Map<string, any>()
  if (liveData.value?.passages) {
    liveData.value.passages.forEach((p: any) => {
      if (p.location) {
        map.set(p.location, p)
      }
    })
  }
  return map
})

// Refresh all data on any real-time event
const handleRefresh = async () => {
  console.log('[stream/index] 🔄 Handling refresh event...')
  try {
    await Promise.all([fetchLive(), fetchStreams()])
    console.log('[stream/index] ✅ Data refreshed successfully')
  } catch (err) {
    console.error('[stream/index] ❌ Error refreshing data:', err)
  }
}

// Use the composable for proper socket room management
useSocketRoom(['streams', 'schedule-updates'], [
  { event: 'stream-update', handler: handleRefresh },
  { event: 'schedule-update', handler: handleRefresh },
  { event: 'status-update', handler: handleRefresh }
])

// Get live streams from liveData
const liveStreams = computed<StreamDisplay[]>(() => {
  if (!liveData.value?.streams) return []
  
  return liveData.value.streams
    .filter((s: any) => s.isLive)
    .map((s: any) => mapStreamToDisplay(s, livePassagesByLocation.value))
})

// Get offline streams from allStreamsData
const offlineStreams = computed<StreamDisplay[]>(() => {
  if (!allStreamsData.value) return []
  
  return allStreamsData.value
    .filter((s: any) => !s.isLive)
    .map((s: any) => mapStreamToDisplay(s, livePassagesByLocation.value))
})

function mapStreamToDisplay(s: any, passagesByLocation: Map<string, any>): StreamDisplay {
  let currentGroupName = '—'
  let currentApparatusName = ''
  let currentApparatusCode = ''
  
  // Find live passage by stream's location (most reliable method)
  const livePassage = s.location ? passagesByLocation.get(s.location) : null
  
  if (livePassage) {
    currentGroupName = livePassage.group?.name || '—'
    currentApparatusName = livePassage.apparatus?.name || ''
    currentApparatusCode = livePassage.apparatus?.code || ''
  } else if (s.currentPassage) {
    // Fallback to currentPassage if no live passage found by location
    const cp = s.currentPassage
    if (typeof cp === 'object' && cp.group) {
      currentGroupName = cp.group.name || '—'
      currentApparatusName = cp.apparatus?.name || ''
      currentApparatusCode = cp.apparatus?.code || ''
    }
  }

  // Determine thumbnail
  const defaultImg = 'https://images.unsplash.com/photo-1764622078388-df36863688d3?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'

  let thumb = s.thumbnail || ''
  if (!thumb && s.url) {
    const url: string = s.url
    const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/)
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)

    const ytId = embedMatch?.[1] || watchMatch?.[1] || shortMatch?.[1]
    if (ytId) {
      thumb = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
    } else if (url.includes('twitch.tv')) {
      const twMatch = url.match(/twitch\.tv\/(.+?)(?:$|\/|\?)/)
      const channel = twMatch?.[1]
      if (channel) {
        thumb = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel}-1280x720.jpg`
      }
    }
  }

  if (!thumb) thumb = defaultImg

  return {
    id: s._id,
    title: s.name || s.title || 'Stream',
    thumbnail: thumb,
    isLive: !!s.isLive,
    salle: s.location || '',
    currentGroup: currentGroupName,
    currentApparatus: currentApparatusName,
    currentApparatusCode: currentApparatusCode
  }
}
</script>

<template>
  <div class="px-4 space-y-6 pb-6">
    <Transition name="premium-swap" mode="out-in">
      <div v-if="showSkeleton" key="stream-skeleton" class="space-y-6">
        <div>
          <div class="premium-skeleton-line premium-skeleton-shimmer h-4 w-28 mb-4 ml-1"></div>
          <CascadeSkeletonList :count="3" layout="vertical" :aria-label="t('common.loading')">
            <template #default>
              <div class="overflow-hidden">
                <div class="premium-skeleton-surface premium-skeleton-shimmer aspect-video w-full"></div>
                <div class="p-4 space-y-2">
                  <div class="premium-skeleton-line premium-skeleton-shimmer h-5 w-2/3"></div>
                  <div class="premium-skeleton-line premium-skeleton-shimmer h-4 w-1/2"></div>
                </div>
              </div>
            </template>
          </CascadeSkeletonList>
        </div>

        <div>
          <div class="premium-skeleton-line premium-skeleton-shimmer h-4 w-32 mb-4 ml-1"></div>
          <CascadeSkeletonList :count="2" layout="vertical" :aria-label="t('common.loading')">
            <template #default>
              <div class="overflow-hidden opacity-70">
                <div class="premium-skeleton-surface premium-skeleton-shimmer aspect-video w-full"></div>
                <div class="p-4 space-y-2">
                  <div class="premium-skeleton-line premium-skeleton-shimmer h-5 w-1/2"></div>
                  <div class="premium-skeleton-line premium-skeleton-shimmer h-4 w-1/3"></div>
                </div>
              </div>
            </template>
          </CascadeSkeletonList>
        </div>
      </div>

      <div v-else key="stream-content" class="space-y-6">
        <!-- Live Streams Section -->
        <div v-if="liveStreams.length > 0">
          <p class="text-white/60 text-sm px-1 mb-4">
            {{ t('stream.liveStreams') }}
          </p>

          <div class="grid grid-cols-1 gap-4">
            <NuxtLink
              v-for="stream in liveStreams" 
              :key="stream.id" 
              :to="`/stream/${stream.id}`"
              class="glass-card overflow-hidden cursor-pointer block hover:border-cyan-400/50 transition-colors"
            >
              <div class="relative aspect-video">
                <ImageWithFallback 
                  :src="stream.thumbnail"
                  :alt="stream.title"
                  class="w-full h-full object-cover"
                />
                
                <div class="absolute top-3 left-3 flex gap-2">
                  <div class="bg-red-500/90 px-3 py-1.5 rounded-full flex items-center gap-2">
                    <span class="w-2 h-2 bg-white rounded-full animate-pulse-glow" />
                    <span class="text-white text-xs font-bold">{{ t('stream.live') }}</span>
                  </div>
                  <div class="glass-card px-3 py-1.5">
                    <span class="text-white text-xs font-medium">{{ stream.salle }}</span>
                  </div>
                </div>

                <div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                  <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon name="fluent:play-24-filled" class="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              <div class="p-4">
                <h3 class="text-white font-bold mb-1">{{ stream.title }}</h3>
                <p class="text-white/60 text-sm">
                  {{ t('stream.onTrack') }}: <span class="text-cyan-400">{{ stream.currentGroup }}</span>
                  <template v-if="stream.currentApparatusCode">
                    <span class="text-white/40"> • </span>
                    <span class="text-purple-400">{{ translateApparatus(stream.currentApparatusCode, stream.currentApparatus) }}</span>
                  </template>
                </p>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- No Live Streams Message -->
        <div v-else class="glass-panel p-8 text-center">
          <Icon name="fluent:video-off-24-regular" class="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h2 class="text-white font-bold text-xl mb-2">{{ t('stream.noLiveStreams') }}</h2>
          <p class="text-white/60">{{ t('stream.liveStreamsWillAppear') }}</p>
        </div>

        <!-- Offline Streams Section -->
        <div v-if="offlineStreams.length > 0">
          <p class="text-white/40 text-sm px-1 mb-4">
            {{ t('stream.offlineStreams') }}
          </p>

          <div class="grid grid-cols-1 gap-4 opacity-60">
            <div
              v-for="stream in offlineStreams" 
              :key="stream.id"
              class="glass-card overflow-hidden cursor-not-allowed"
            >
              <div class="relative aspect-video">
                <ImageWithFallback 
                  :src="stream.thumbnail"
                  :alt="stream.title"
                  class="w-full h-full object-cover grayscale"
                />
                
                <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div class="text-center">
                    <Icon name="fluent:video-off-24-regular" class="w-10 h-10 text-white/50 mx-auto mb-2" />
                    <span class="text-white/50 text-sm font-medium">{{ t('stream.offline') }}</span>
                  </div>
                </div>
                
                <div class="absolute top-3 left-3">
                  <div class="glass-card px-3 py-1.5">
                    <span class="text-white/50 text-xs font-medium">{{ stream.salle }}</span>
                  </div>
                </div>
              </div>

              <div class="p-4">
                <h3 class="text-white/50 font-bold mb-1">{{ stream.title }}</h3>
                <p class="text-white/30 text-sm">{{ t('stream.streamUnavailable') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
