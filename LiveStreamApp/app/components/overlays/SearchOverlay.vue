<script setup lang="ts">
import type { PassageEnriched, Stream, EnrichedGroup } from '~/types/api'

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
// ⚠️ DEAD CODE : const { locale } = useI18n()
const { translateApparatus, translateCategory, formatLocalizedTime } = useTranslatedData()
const router = useRouter()
const searchInput = ref<HTMLInputElement | null>(null)
const activeTab = ref<'all' | 'groups' | 'passages' | 'live'>('all')

const { open: openGroupDetails } = useGroupDetails()

const {
  searchQuery,
  isLoading,
  groupResults,
  passageResults,
  liveResults,
  resetSearch
} = useGlobalSearch()

// Réinitialise la recherche lors de la fermeture de la modale pour éviter de conserver un état obsolète à la réouverture.
watch(() => props.isOpen, (open) => {
  if (!open) {
    resetSearch()
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

// Permet de fermer la modale rapidement au clavier.
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

// ─── Actions de navigation ──────────────────────────────────────────────────

const goToGroup = (group: EnrichedGroup) => {
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

// ─── Utilitaires d'affichage ────────────────────────────────────────────────

const formatTime = (date: string) => {
  return formatLocalizedTime(date)
}

// Détermine s'il y a des résultats sur n'importe quel onglet pour conditionner l'affichage.
const hasResults = computed(() => {
  return groupResults.value.length > 0 || 
         passageResults.value.length > 0 || 
         liveResults.value.passages.length > 0 ||
         liveResults.value.streams.length > 0
})

// Filtrage des résultats selon l'onglet actif.
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
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeydown)
  }
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

            <UiIconButton
              v-else-if="searchQuery"
              icon="fluent:dismiss-circle-24-filled"
              variant="ghost"
              :label="t('search.clearSearch')"
              @click="clearSearch"
              class="flex-shrink-0 text-white/60 hover:text-white"
            />

            <UiIconButton
              icon="fluent:dismiss-24-regular"
              variant="ghost"
              :label="t('search.closeSearch')"
              @click="emit('close')"
              class="flex-shrink-0"
            />
          </div>
        </div>

        <div v-if="searchQuery.length >= 2" class="flex gap-1 p-2 border-b border-white/10 overflow-x-auto" role="tablist" :aria-label="t('filters.title')">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120] outline-none"
            :class="activeTab === tab.id ? 'bg-cyan-500/30 text-cyan-300' : 'text-white/60 hover:bg-white/10'"
            role="tab"
            :aria-selected="activeTab === tab.id"
            aria-controls="search-results-panel"
          >
            <Icon :name="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </button>
        </div>

        <div id="search-results-panel" class="p-4 max-h-[60vh] overflow-y-auto" aria-live="polite" role="tabpanel">
          <template v-if="searchQuery.length < 2">
            <div class="text-center py-8 text-white/50">
              <Icon name="fluent:search-24-regular" class="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{{ t('search.minCharacters') }}</p>
            </div>
          </template>

          <template v-else-if="isLoading">
            <div class="flex flex-col items-center justify-center py-12" role="status">
              <Icon name="fluent:spinner-ios-20-regular" class="w-10 h-10 text-cyan-400 animate-spin" />
              <p class="text-white/60 mt-3">{{ t('search.searching') }}</p>
            </div>
          </template>

          <template v-else-if="!hasResults">
            <div class="flex flex-col items-center justify-center py-12 text-center text-white/60">
              <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Icon name="fluent:search-info-24-regular" class="w-8 h-8 opacity-50" />
              </div>
              <p class="text-lg font-medium text-white/80">{{ t('search.noResults') }}</p>
              <p class="text-sm mt-1">{{ t('search.tryAnother') }}</p>
            </div>
          </template>

          <template v-else>
            <div class="space-y-6">
              <!-- Diffusions en direct et passages en cours -->
              <div v-if="filteredLiveResults.passages.length > 0 || filteredLiveResults.streams.length > 0">
                <h3 class="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  {{ t('search.live') }}
                </h3>
                
                <div v-if="filteredLiveResults.streams.length > 0" class="space-y-2 mb-3">
                  <button
                    v-for="stream in filteredLiveResults.streams"
                    :key="stream._id"
                    @click="goToStream(stream)"
                    :aria-label="`${stream.name} - ${stream.location}`"
                    class="w-full glass-card p-3 text-left hover:bg-white/15 transition-colors rounded-xl flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120] outline-none"
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

                <div v-if="filteredLiveResults.passages.length > 0" class="space-y-2">
                  <button
                    v-for="passage in filteredLiveResults.passages"
                    :key="passage._id"
                    @click="goToPassage(passage)"
                    :aria-label="`Live: ${passage.group?.name} - ${translateApparatus(passage.apparatus?.code, passage.apparatus?.name)} à ${passage.location}`"
                    class="w-full glass-card p-3 text-left hover:bg-white/15 transition-colors rounded-xl flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120] outline-none"
                  >
                    <div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center relative">
                      <Icon :name="passage.apparatus?.icon || 'fluent:sport-24-regular'" class="w-5 h-5 text-red-400" />
                      <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-white font-medium truncate">{{ passage.group?.name }}</p>
                      <p class="text-white/50 text-sm">{{ translateApparatus(passage.apparatus?.code, passage.apparatus?.name) }} • {{ passage.location }}</p>
                    </div>
                    <span class="px-2 py-0.5 bg-red-500/30 text-red-300 text-xs font-medium rounded-full">LIVE</span>
                  </button>
                </div>
              </div>

              <!-- Groupes correspondants -->
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
                    :aria-label="`${group.name} - ${group.canton} - ${translateCategory(group.category)}`"
                    class="w-full glass-card p-3 text-left hover:bg-white/15 transition-colors rounded-xl flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120] outline-none"
                  >
                    <div class="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center overflow-hidden">
                      <NuxtImg format="webp" loading="lazy" v-if="group.logo" :src="group.logo" :alt="group.name" class="w-full h-full object-cover" />
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

              <!-- Passages correspondants -->
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
                    :aria-label="`${passage.group?.name} - ${translateApparatus(passage.apparatus?.code, passage.apparatus?.name)} à ${formatTime(passage.startTime)} en ${passage.location}`"
                    class="w-full glass-card p-3 text-left hover:bg-white/15 transition-colors rounded-xl flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120] outline-none"
                  >
                    <div class="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Icon :name="passage.apparatus?.icon || 'fluent:sport-24-regular'" class="w-5 h-5 text-purple-400" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-white font-medium truncate">{{ passage.group?.name }}</p>
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

        <div v-if="searchQuery.length >= 2 && hasResults" class="p-3 border-t border-white/10 flex gap-2">
          <button
            @click="goToLive"
            class="flex-1 glass-card py-2 px-4 text-center text-cyan-300 hover:bg-cyan-500/20 transition-colors rounded-lg text-sm font-medium flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120] outline-none"
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
