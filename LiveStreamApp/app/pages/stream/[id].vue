<script setup lang="ts">
import type { Stream, Passage, Group, Apparatus } from '../../types/api'
import { ref, watch, onBeforeUnmount, onMounted, computed } from 'vue'

const { t } = useI18n()
const { translateApparatus } = useTranslatedData()
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string

// Define populated types for this view
interface PopulatedPassage extends Omit<Passage, 'group' | 'apparatus'> {
  group: Group;
  apparatus: Apparatus;
}

interface PopulatedStream extends Omit<Stream, 'currentPassage'> {
  currentPassage?: PopulatedPassage | null;
}

// Use refs for reactive data that updates in real-time
const stream = ref<PopulatedStream | null>(null)
const livePassages = ref<any[]>([])
const groupDetails = ref<any>(null) // Full group details from API
const pending = ref(true)
const error = ref<any>(null)

// Fetch stream
const fetchStream = async () => {
  try {
    stream.value = await $fetch<PopulatedStream>(`/streams/${route.params.id}`, { baseURL: apiBase })
    console.log('[stream/id] Stream fetched:', stream.value?.name, 'location:', stream.value?.location)
  } catch (err: any) {
    console.error('[stream/id] Error fetching stream:', err)
    error.value = err
  }
}

// Fetch live passages to get current group/apparatus info
const fetchLivePassages = async () => {
  try {
    const liveData = await $fetch<{ passages: any[]; streams: any[] }>('/live', { baseURL: apiBase })
    livePassages.value = liveData.passages || []
    console.log('[stream/id] Live passages fetched:', livePassages.value.length)
  } catch (err: any) {
    console.error('[stream/id] Error fetching live passages:', err)
  }
}

// Fetch full group details when we have a current passage
const fetchGroupDetails = async (groupId: string) => {
  try {
    const details = await $fetch<any>(`/groups/${groupId}/details`, { baseURL: apiBase })
    groupDetails.value = details
    console.log('[stream/id] Group details fetched:', details?.info?.name)
  } catch (err: any) {
    console.error('[stream/id] Error fetching group details:', err)
  }
}

// Fetch all data
const fetchAll = async () => {
  await Promise.all([fetchStream(), fetchLivePassages()])
  pending.value = false
}

// Initial fetch (SSR + client)
await fetchAll()

// Also fetch on mount to ensure fresh data
onMounted(() => {
  fetchAll()
})

// Use current passage directly from stream (already populated by API)
// Falls back to matching from livePassages if stream.currentPassage is not set
const currentPassage = computed(() => {
  // Primary: use the populated currentPassage from stream
  if (stream.value?.currentPassage) {
    return stream.value.currentPassage as PopulatedPassage
  }
  // Fallback: match by location from live passages
  if (!stream.value?.location) return null
  return livePassages.value.find(p => p.location === stream.value?.location) || null
})

// Watch for current passage changes to fetch group details
watch(() => currentPassage.value?.group?._id, async (groupId) => {
  if (groupId) {
    await fetchGroupDetails(groupId)
  } else {
    groupDetails.value = null
  }
}, { immediate: true })

// Build complete group object for GroupInfoCard
const currentGroup = computed(() => {
  if (!groupDetails.value?.info) {
    // Fallback to basic info from passage
    return currentPassage.value?.group || null
  }
  
  // Merge group details with additional stats
  return {
    ...groupDetails.value.info,
    monitors: groupDetails.value.monitors || [],
    history: groupDetails.value.history || [],
    // Add computed average from stats
    averageScore: groupDetails.value.stats?.currentTotalScore || 0
  }
})

// Redirect if stream is not live
watch(() => stream.value?.isLive, (isLive) => {
  if (stream.value && isLive === false) {
    console.log('[stream/id] Stream went offline, redirecting...')
    navigateTo('/stream')
  }
}, { immediate: true })

if (error.value) {
  console.error('Error loading stream:', error.value)
  await navigateTo('/stream')
}

// Check if stream exists and is live on initial load
if (stream.value && !stream.value.isLive) {
  await navigateTo('/stream')
}

// Computeds for safe access
const streamUrl = computed(() => stream.value?.url)
const isEmbed = computed(() => streamUrl.value?.includes('youtube') || streamUrl.value?.includes('vimeo'))
const currentApparatus = computed(() => currentPassage.value?.apparatus || null)
const passageMonitors = computed(() => currentPassage.value?.monitors || [])

const openGroupDetails = inject<(groupId: string, apparatusCode?: string) => void>('openGroupDetails')

// Detect iframe load failures (e.g., blocked by extensions) and show fallback
const playerLoaded = ref(false)
const playerFailed = ref(false)
let playerTimeout: ReturnType<typeof setTimeout> | null = null

const onIframeLoad = () => {
  playerLoaded.value = true
  playerFailed.value = false
  if (playerTimeout) {
    clearTimeout(playerTimeout)
    playerTimeout = null
  }
}

watch(streamUrl, (url) => {
  playerLoaded.value = false
  playerFailed.value = false
  if (playerTimeout) {
    clearTimeout(playerTimeout)
    playerTimeout = null
  }
  if (url && isEmbed.value) {
    // If iframe hasn't fired load in 4s, consider it blocked/failed
    playerTimeout = setTimeout(() => {
      if (!playerLoaded.value) {
        playerFailed.value = true
        // Helpful console message for debugging in dev
        console.warn('[stream] iframe did not finish loading (possible blocked requests or adblocker)')
      }
    }, 4000)
  }
})

// Refresh data on any real-time event
const handleRefresh = async (payload?: any) => {
  console.log('[stream/id] 🔄 Handling refresh event...', payload)
  try {
    await fetchAll()
    console.log('[stream/id] ✅ Data refreshed, currentGroup:', currentGroup.value?.name, 'currentApparatus:', currentApparatus.value?.name)
  } catch (err) {
    console.error('[stream/id] ❌ Error refreshing data:', err)
  }
}

// Handle stream-update with direct payload update
const handleStreamUpdate = (payload: any) => {
  console.log('[stream/id] 📺 Stream update received:', payload)
  
  // Si le payload contient les données du stream actuel, les utiliser directement
  if (payload && payload._id === route.params.id && stream.value) {
    // Mise à jour directe depuis le payload
    if (payload.currentPassage !== undefined) {
      stream.value = {
        ...stream.value,
        currentPassage: payload.currentPassage
      }
      console.log('[stream/id] ✅ Direct update from payload')
      
      // Fetch group details if needed
      if (payload.currentPassage?.group?._id) {
        fetchGroupDetails(payload.currentPassage.group._id)
      }
      return
    }
  }
  
  // Fallback: refresh depuis l'API
  handleRefresh(payload)
}

// Cleanup player timeout on unmount
onBeforeUnmount(() => {
  if (playerTimeout) clearTimeout(playerTimeout)
})

// Use the composable for proper socket room management
const streamRoom = `stream-${route.params.id}`

useSocketRoom([streamRoom, 'streams', 'schedule-updates'], [
  { event: 'stream-update', handler: handleStreamUpdate },
  { event: 'status-update', handler: handleRefresh },
  { event: 'schedule-update', handler: handleRefresh }
])
</script>

<template>
  <div class=" px-4 min-h-screen relative z-10">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink
        to="/stream"
        class="p-3 rounded-full hover:bg-white/10 glass-panel transition-colors flex items-center justify-center"
      >
        <Icon name="fluent:arrow-left-24-regular" class="w-6 h-6 text-white" />
      </NuxtLink>
      <h1 class="text-xl font-bold text-white">{{ t('stream.backToStreams') }}</h1>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="space-y-6">
      <div class="aspect-video rounded-3xl bg-white/5 animate-pulse" />
      <div class="h-48 rounded-3xl bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="stream" class="space-y-6">
      <!-- Main Stage (Player) -->
      <div class="glass-panel p-1 rounded-3xl overflow-hidden shadow-2xl relative group">
        <div class="aspect-video rounded-2xl overflow-hidden bg-black relative">
          <iframe
            v-if="isEmbed && streamUrl"
            :src="streamUrl"
            class="w-full h-full"
            frameborder="0"
            @load="onIframeLoad"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>

          <!-- If iframe failed to load (e.g., blocked by adblocker), show fallback with external link -->
          <div v-if="playerFailed" class="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-center p-4">
            <p class="text-white mb-3">{{ t('stream.playerBlocked') }}</p>
            <a
              :href="streamUrl"
              rel="noopener noreferrer"
              class="inline-block bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg"
            >
              {{ t('stream.openStream') }}
            </a>
          </div>

          <div v-else-if="!isEmbed || !streamUrl" class="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div class="w-20 h-20 rounded-full glass-panel flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icon name="fluent:play-24-filled" class="w-10 h-10 text-white ml-1" />
            </div>
            <a
              v-if="streamUrl"
              :href="streamUrl"
              rel="noopener noreferrer"
              class="text-white font-bold hover:underline"
            >
              {{ t('stream.openExternalLink') }}
            </a>
            <p v-else class="text-white/60">{{ t('stream.noLinkAvailable') }}</p>
          </div>
        </div>
      </div>

      <!-- Meta Bar -->
      <div class="glass-panel p-4 rounded-2xl flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="relative">
            <div class="w-3 h-3 bg-red-500 rounded-full animate-ping absolute inset-0 opacity-75"></div>
            <div class="w-3 h-3 bg-red-500 rounded-full relative"></div>
          </div>
          <div>
            <h2 class="text-white font-bold text-lg leading-tight">{{ stream.name }}</h2>
            <p class="text-red-400 text-xs font-bold uppercase tracking-wider">{{ t('stream.liveNow') }}</p>
          </div>
        </div>

        <div v-if="currentApparatus" class="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
          <Icon :name="currentApparatus.icon || 'fluent:sport-24-regular'" class="w-5 h-5 text-cyan-400" />
          <span class="text-white font-medium text-sm">{{ translateApparatus(currentApparatus.code, currentApparatus.name) }}</span>
        </div>
      </div>

      <!-- Context Section -->
      <div v-if="currentGroup">
        <h3 class="text-white/60 font-medium mb-3 ml-1">{{ t('stream.onPracticable') }}</h3>
        <div @click="openGroupDetails && currentGroup._id && openGroupDetails(currentGroup._id, currentApparatus?.code)" class="cursor-pointer active:scale-[0.98] transition-transform">
           <GroupInfoCard :group="currentGroup" :passage-monitors="passageMonitors" />
        </div>
      </div>

      <div v-else class="glass-panel p-6 text-center">
        <p class="text-white/60">{{ t('stream.noCurrentPassage') }}</p>
      </div>
    </div>

    <div v-else class="glass-panel p-8 text-center">
      <h2 class="text-white font-bold text-xl mb-2">{{ t('stream.streamNotFound') }}</h2>
      <NuxtLink to="/stream" class="text-cyan-400 hover:underline">{{ t('stream.backToList') }}</NuxtLink>
    </div>
  </div>
</template>
