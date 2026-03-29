<script setup lang="ts">
import CascadeSkeletonList from '~/components/loading/CascadeSkeletonList.vue'
import { PublicService } from '../../services/public.service'
import type { Stream, PassageEnriched } from '../../types/api'
import { STREAM_AUTO_REFRESH } from '~/utils/timings'

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

// Fetch data using useAsyncData for better SSR hydration
const { data, pending, refresh, error } = await useAsyncData('streams-index', async () => {
  const [liveResp, streamsResp] = await Promise.all([
    PublicService.fetchLive(),
    PublicService.fetchStreams()
  ])
  return { liveData: liveResp, allStreamsData: streamsResp }
}, {
  lazy: false,
  server: true
})

if (error.value) {
  console.error('[stream/index] Error fetching data:', error.value)
}

const { hasLoadedOnce, showSkeleton } = useFirstLoad(pending, data)

// Build a map of live passages by LOCATION for quick lookup
const livePassagesByLocation = computed(() => {
  const map = new Map<string, PassageEnriched>()
  if (data.value?.liveData?.passages) {
    data.value.liveData.passages.forEach((p: PassageEnriched) => {
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
    await refresh()
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

// PWA fallback: periodic auto-refresh + reprise de visibilité (onglet ou app)
useAutoRefresh(handleRefresh, STREAM_AUTO_REFRESH)

// Get live streams from liveData
const liveStreams = computed<StreamDisplay[]>(() => {
  if (!data.value?.liveData?.streams) return []
  
  return data.value.liveData.streams
    .filter((s: Stream) => s.isLive)
    .map((s: Stream) => mapStreamToDisplay(s, livePassagesByLocation.value))
})

// Get offline streams from allStreamsData
const offlineStreams = computed<StreamDisplay[]>(() => {
  if (!data.value?.allStreamsData) return []
  
  return data.value.allStreamsData
    .filter((s: Stream) => !s.isLive)
    .map((s: Stream) => mapStreamToDisplay(s, livePassagesByLocation.value))
})

function mapStreamToDisplay(s: Stream, passagesByLocation: Map<string, PassageEnriched>): StreamDisplay {
  let currentGroupName = ''
  let currentApparatusName = ''
  let currentApparatusCode = ''
  
  // Find live passage by stream's location (most reliable method)
  const livePassage = s.location ? passagesByLocation.get(s.location) : null
  
  if (livePassage) {
    currentGroupName = livePassage.group?.name || ''
    currentApparatusName = livePassage.apparatus?.name || ''
    currentApparatusCode = livePassage.apparatus?.code || ''
  } else if (s.currentPassage) {
    // Fallback to currentPassage if no live passage found by location
    const cp = s.currentPassage as any // currentPassage can be string or object depending on population, but here it might be populated or partially populated
    if (typeof cp === 'object' && cp && cp.group) {
      currentGroupName = cp.group.name || ''
      currentApparatusName = cp.apparatus?.name || ''
      currentApparatusCode = cp.apparatus?.code || ''
    }
  }

  // Determine thumbnail
  const defaultImg = 'https://images.unsplash.com/photo-1764622078388-df36863688d3?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'

  const thumb = s.thumbnail || getStreamThumbnailUrl(s.url, defaultImg)

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

          <div class="grid grid-cols-1 gap-8">
            <DomainStreamCard
              v-for="stream in liveStreams" 
              :key="stream.id" 
              :stream="stream"
              is-live
            />
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

          <div class="grid grid-cols-1 gap-8">
            <DomainStreamCard
              v-for="stream in offlineStreams" 
              :key="stream.id"
              :stream="stream"
              :is-live="false"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
