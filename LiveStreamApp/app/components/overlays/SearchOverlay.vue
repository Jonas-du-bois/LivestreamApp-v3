<script setup lang="ts">
import type { PassageEnriched, Stream, Group } from '~/types/api'

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const { t, locale } = useI18n()
const { translateApparatus, translateCategory } = useTranslatedData()
const router = useRouter()
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const isLoading = ref(false)
const activeTab = ref<'all' | 'groups' | 'passages' | 'live'>('all')

// Inject group details opener
const openGroupDetails = inject<(groupId: string, apparatusCode?: string) => void>('openGroupDetails')

// Search results
const groupResults = ref<Group[]>([])
const passageResults = ref<PassageEnriched[]>([])
const liveResults = ref<{ passages: PassageEnriched[], streams: Stream[] }>({ passages: [], streams: [] })

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const performSearch = async (query: string) => {
  if (!query || query.length < 2) {
    groupResults.value = []
    passageResults.value = []
    liveResults.value = { passages: [], streams: [] }
    return
  }

  isLoading.value = true
  const q = query.toLowerCase()

  try {
    // Fetch all data in parallel
    const [scheduleRes, liveRes] = await Promise.all([
      $fetch<{ meta: any; data: PassageEnriched[] }>('/api/schedule'),
      $fetch<{ passages: PassageEnriched[]; streams: Stream[] }>('/api/live')
    ])

    // Extract unique groups from passages
    const groupsMap = new Map<string, Group>()
    scheduleRes.data.forEach((p) => {
      if (p.group && p.group._id) {
        groupsMap.set(p.group._id, p.group as Group)
      }
    })
    const allGroups = Array.from(groupsMap.values())

    // Filter groups
    groupResults.value = allGroups.filter((g) =>
      g.name?.toLowerCase().includes(q) ||
      g.canton?.toLowerCase().includes(q) ||
      g.category?.toLowerCase().includes(q)
    ).slice(0, 10)

    // Filter passages (by group name, apparatus name, location)
    passageResults.value = scheduleRes.data.filter((p) =>
      (p.group as any)?.name?.toLowerCase().includes(q) ||
      (p.apparatus as any)?.name?.toLowerCase().includes(q) ||
      (p.apparatus as any)?.code?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q)
    ).slice(0, 15)

    // Filter live data
    const livePassages = liveRes.passages.filter((p) =>
      (p.group as any)?.name?.toLowerCase().includes(q) ||
      (p.apparatus as any)?.name?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q)
    )
    const liveStreams = liveRes.streams.filter((s) =>
      s.name?.toLowerCase().includes(q) ||
      s.location?.toLowerCase().includes(q)
    )
    liveResults.value = { passages: livePassages, streams: liveStreams }

  } catch (err) {
    console.error('[SearchOverlay] Error fetching data:', err)
  } finally {
    isLoading.value = false
  }
}

watch(() => searchQuery.value, (newQuery) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    performSearch(newQuery)
  }, 300)
})

// Reset when closed
watch(() => props.isOpen, (open) => {
  if (!open) {
    searchQuery.value = ''
    groupResults.value = []
    passageResults.value = []
    liveResults.value = { passages: [], streams: [] }
    activeTab.value = 'all'
  } else {
    nextTick(() => searchInput.value?.focus())
  }
})

const clearSearch = () => {
  searchQuery.value = ''
  nextTick(() => {
    searchInput.value?.focus()
  })
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

// Navigation actions
const goToGroup = (group: Group) => {
  emit('close')
  if (openGroupDetails && group._id) {
    openGroupDetails(group._id)
  }
}

const goToPassage = (passage: PassageEnriched) => {
  emit('close')
  if (openGroupDetails && passage.group?._id) {
    openGroupDetails(passage.group._id, passage.apparatus?.code)
  }
}

const goToStream = (stream: Stream) => {
  emit('close')
  router.push(`/stream/${stream._id}`)
}

const goToLive = () => {
  emit('close')
  router.push('/stream')
}

// Format time
const formatTime = (date: string) => {
  const loc = locale.value === 'de' ? 'de-CH' : 'fr-CH'
  return new Date(date).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })
}

// Computed: has results
const hasResults = computed(() => {
  return groupResults.value.length > 0 || 
         passageResults.value.length > 0 || 
         liveResults.value.passages.length > 0 ||
         liveResults.value.streams.length > 0
})

const filteredGroupResults = computed(() => activeTab.value === 'all' || activeTab.value === 'groups' ? groupResults.value : [])
const filteredPassageResults = computed(() => activeTab.value === 'all' || activeTab.value === 'passages' ? passageResults.value : [])
const filteredLiveResults = computed(() => activeTab.value === 'all' || activeTab.value === 'live' ? liveResults.value : { passages: [], streams: [] })

const tabs = computed(() => [
  { id: 'all' as const, label: t('search.all'), icon: 'fluent:apps-24-regular' },
  { id: 'groups' as const, label: t('search.groups'), icon: 'fluent:people-24-regular' },
  { id: 'passages' as const, label: t('search.passages'), icon: 'fluent:calendar-24-regular' },
  { id: 'live' as const, label: t('search.live'), icon: 'fluent:live-24-regular' }
])

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (searchTimeout) clearTimeout(searchTimeout)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="slide-down">
      <div
        v-if="isOpen"
        class="fixed left-4 right-4 glass-panel z-[70] overflow-hidden max-w-2xl mx-auto overlay-safe-top"
        role="dialog"
        aria-modal="true"
        :aria-label="t('common.search')"
      >
        <!-- Search Input -->
        <div class="p-4 border-b border-white/10">
          <div class="flex items-center gap-3">
            <Icon name="fluent:search-24-regular" class="w-5 h-5 text-white/60 flex-shrink-0" />
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              :placeholder="t('search.placeholder')"
              class="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-lg"
              :aria-label="t('common.search')"
            />

            <div v-if="isLoading" class="flex-shrink-0">
              <Icon name="fluent:spinner-ios-20-regular" class="w-5 h-5 text-white/60 animate-spin" />
            </div>

            <button
              v-else-if="searchQuery"
              @click="clearSearch"
              class="p-1 hover:text-white text-white/60 transition-colors rounded-full focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
              :aria-label="t('search.clearSearch')"
            >
              <Icon name="fluent:dismiss-circle-24-filled" class="w-5 h-5" />
            </button>

            <button
              @click="emit('close')"
              class="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
              :aria-label="t('search.closeSearch')"
            >
              <Icon name="fluent:dismiss-24-regular" class="w-5 h-5 text-white/80" />
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div v-if="searchQuery.length >= 2" class="flex gap-1 p-2 border-b border-white/10 overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
            :class="activeTab === tab.id ? 'bg-cyan-500/30 text-cyan-300' : 'text-white/60 hover:bg-white/10'"
          >
            <Icon :name="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </button>
        </div>

        <!-- Search Results -->
        <div class="p-4 max-h-[60vh] overflow-y-auto" aria-live="polite">
          <!-- Initial state -->
          <template v-if="searchQuery.length < 2">
            <div class="text-center py-8 text-white/50">
              <Icon name="fluent:search-24-regular" class="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{{ t('search.minCharacters') }}</p>
            </div>
          </template>

          <!-- Loading -->
          <template v-else-if="isLoading">
            <div class="flex flex-col items-center justify-center py-12">
              <Icon name="fluent:spinner-ios-20-regular" class="w-10 h-10 text-cyan-400 animate-spin" />
              <p class="text-white/60 mt-3">{{ t('search.searching') }}</p>
            </div>
          </template>

          <!-- No results -->
          <template v-else-if="!hasResults">
            <div class="flex flex-col items-center justify-center py-12 text-center text-white/60">
              <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Icon name="fluent:search-info-24-regular" class="w-8 h-8 opacity-50" />
              </div>
              <p class="text-lg font-medium text-white/80">{{ t('search.noResults') }}</p>
              <p class="text-sm mt-1">{{ t('search.tryAnother') }}</p>
            </div>
          </template>

          <!-- Results -->
          <template v-else>
            <div class="space-y-6">
              <!-- Live Results -->
              <div v-if="filteredLiveResults.passages.length > 0 || filteredLiveResults.streams.length > 0">
                <h3 class="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  {{ t('search.live') }}
                </h3>
                
                <!-- Live Streams -->
                <div v-if="filteredLiveResults.streams.length > 0" class="space-y-2 mb-3">
                  <button
                    v-for="stream in filteredLiveResults.streams"
                    :key="stream._id"
                    @click="goToStream(stream)"
                    class="w-full glass-card p-3 text-left hover:bg-white/15 transition-colors rounded-xl flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
                  >
                    <div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <Icon name="fluent:video-24-filled" class="w-5 h-5 text-red-400" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-white font-medium truncate">{{ stream.name }}</p>
                      <p class="text-white/50 text-sm">{{ stream.location }}</p>
                    </div>
                    <Icon name="fluent:chevron-right-24-regular" class="w-5 h-5 text-white/40" />
                  </button>
                </div>

                <!-- Live Passages -->
                <div v-if="filteredLiveResults.passages.length > 0" class="space-y-2">
                  <button
                    v-for="passage in filteredLiveResults.passages"
                    :key="passage._id"
                    @click="goToPassage(passage)"
                    class="w-full glass-card p-3 text-left hover:bg-white/15 transition-colors rounded-xl flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
                  >
                    <div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center relative">
                      <Icon :name="passage.apparatus?.icon || 'fluent:sport-24-regular'" class="w-5 h-5 text-red-400" />
                      <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-white font-medium truncate">{{ (passage.group as any)?.name }}</p>
                      <p class="text-white/50 text-sm">{{ translateApparatus(passage.apparatus?.code, passage.apparatus?.name) }} • {{ passage.location }}</p>
                    </div>
                    <span class="px-2 py-0.5 bg-red-500/30 text-red-300 text-xs font-medium rounded-full">LIVE</span>
                  </button>
                </div>
              </div>

              <!-- Group Results -->
              <div v-if="filteredGroupResults.length > 0">
                <h3 class="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Icon name="fluent:people-24-regular" class="w-4 h-4" />
                  {{ t('search.groups') }} ({{ filteredGroupResults.length }})
                </h3>
                <div class="space-y-2">
                  <button
                    v-for="group in filteredGroupResults"
                    :key="group._id"
                    @click="goToGroup(group)"
                    class="w-full glass-card p-3 text-left hover:bg-white/15 transition-colors rounded-xl flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
                  >
                    <div class="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center overflow-hidden">
                      <img v-if="group.logo" :src="group.logo" :alt="group.name" class="w-full h-full object-cover" />
                      <Icon v-else name="fluent:people-team-24-regular" class="w-5 h-5 text-cyan-400" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-white font-medium truncate">{{ group.name }}</p>
                      <p class="text-white/50 text-sm">{{ group.canton }} • {{ translateCategory(group.category) }}</p>
                    </div>
                    <Icon name="fluent:chevron-right-24-regular" class="w-5 h-5 text-white/40" />
                  </button>
                </div>
              </div>

              <!-- Passage Results -->
              <div v-if="filteredPassageResults.length > 0">
                <h3 class="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Icon name="fluent:calendar-24-regular" class="w-4 h-4" />
                  {{ t('search.passages') }} ({{ filteredPassageResults.length }})
                </h3>
                <div class="space-y-2">
                  <button
                    v-for="passage in filteredPassageResults"
                    :key="passage._id"
                    @click="goToPassage(passage)"
                    class="w-full glass-card p-3 text-left hover:bg-white/15 transition-colors rounded-xl flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
                  >
                    <div class="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Icon :name="passage.apparatus?.icon || 'fluent:sport-24-regular'" class="w-5 h-5 text-purple-400" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-white font-medium truncate">{{ (passage.group as any)?.name }}</p>
                      <p class="text-white/50 text-sm">
                        {{ translateApparatus(passage.apparatus?.code, passage.apparatus?.name) }} • {{ formatTime(passage.startTime) }} • {{ passage.location }}
                      </p>
                    </div>
                    <span 
                      class="px-2 py-0.5 text-xs font-medium rounded-full"
                      :class="{
                        'bg-green-500/30 text-green-300': passage.status === 'FINISHED',
                        'bg-yellow-500/30 text-yellow-300': passage.status === 'SCHEDULED',
                        'bg-red-500/30 text-red-300': passage.status === 'LIVE'
                      }"
                    >
                      {{ passage.status === 'FINISHED' ? t('status.finished') : passage.status === 'LIVE' ? t('status.live') : t('status.scheduled') }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Quick Actions Footer -->
        <div v-if="searchQuery.length >= 2 && hasResults" class="p-3 border-t border-white/10 flex gap-2">
          <button
            @click="goToLive"
            class="flex-1 glass-card py-2 px-4 text-center text-cyan-300 hover:bg-cyan-500/20 transition-colors rounded-lg text-sm font-medium flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
          >
            <Icon name="fluent:live-24-regular" class="w-4 h-4" />
            {{ t('search.allLiveStreams') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100px);
}
</style>
