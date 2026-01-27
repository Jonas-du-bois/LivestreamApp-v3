<script setup lang="ts">
import { PublicService } from '../../services/public.service'
import { useSocket } from '../../composables/useSocket'
import type { PassageEnriched } from '../../types/api'

interface Props {
  isOpen: boolean
  groupId?: string
  // Fallback or display only if ID not available immediately
  groupName?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const socket = useSocket()
const isLoading = ref(false)
const error = ref<string | null>(null)
const details = ref<any>(null)

const fetchData = async () => {
  if (!props.groupId) return

  isLoading.value = true
  error.value = null
  try {
    const { data } = await PublicService.getGroupDetails(props.groupId)
    details.value = data.value
  } catch (err) {
    console.error(err)
    error.value = "Impossible de charger les détails du groupe."
  } finally {
    isLoading.value = false
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.groupId) {
    fetchData()
  } else {
    // Reset state on close if needed?
    // details.value = null
  }
})

watch(() => props.groupId, (newId) => {
  if (props.isOpen && newId) {
    fetchData()
  }
})

// Real-time updates
const handleScoreUpdate = (payload: any) => {
  // Payload: { passageId, scores: { ... } }
  if (!details.value || !details.value.timeline) return

  const passage = details.value.timeline.find((p: any) => p._id === payload.passageId)
  if (passage) {
    passage.scores = payload.scores
    if (passage.status !== 'FINISHED' && payload.scores.isPublished) {
        passage.status = 'FINISHED'
        // Trigger re-fetch of stats? Or compute locally?
        // Simple local update for stats
        recomputeStats()
    } else if (passage.status === 'SCHEDULED' && !payload.scores.isPublished) {
        passage.status = 'LIVE'
    }
  }
}

const recomputeStats = () => {
   if (!details.value) return
   const finished = details.value.timeline.filter((p: any) => p.status === 'FINISHED' && p.scores?.total)
   const total = finished.reduce((acc: number, curr: any) => acc + (curr.scores?.total || 0), 0)
   const count = finished.length

   details.value.stats.completedPassages = count
   details.value.stats.currentTotalScore = count > 0 ? (total / count).toFixed(2) : '0.00'
}

onMounted(() => {
  socket.on('score-update', handleScoreUpdate)
})

onUnmounted(() => {
  socket.off('score-update', handleScoreUpdate)
})

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80]"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="scale">
      <div
        v-if="isOpen"
        class="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90%] md:max-w-lg glass-panel z-[90] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div v-if="isLoading && !details" class="p-12 text-center text-white/60">
           <Icon name="fluent:spinner-ios-20-filled" class="w-8 h-8 animate-spin mx-auto mb-4" />
           <p>Chargement du tableau de bord...</p>
        </div>

        <div v-else-if="error" class="p-12 text-center text-red-400">
           <Icon name="fluent:error-circle-24-regular" class="w-8 h-8 mx-auto mb-4" />
           <p>{{ error }}</p>
        </div>

        <template v-else-if="details">
            <!-- Header -->
            <div class="relative h-48 overflow-hidden flex-shrink-0">
            <!-- Background Image/Placeholder -->
            <div class="absolute inset-0 bg-gradient-to-br from-cyan-900/40 to-purple-900/40" />
             <ImageWithFallback
                src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2340&auto=format&fit=crop"
                class="w-full h-full object-cover opacity-60"
                alt="Gymnastics"
            />

            <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0B1120]" />

            <button
                @click="emit('close')"
                class="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-lg transition-colors"
            >
                <Icon name="fluent:dismiss-24-regular" class="w-5 h-5 text-white" />
            </button>

            <div class="absolute bottom-6 left-6 right-6 z-10">
                <div class="flex items-end justify-between">
                    <div>
                        <h2 class="text-white font-bold text-2xl mb-1 leading-tight">{{ details.info.name }}</h2>
                        <div class="flex items-center gap-2">
                             <span class="px-2 py-0.5 rounded-md bg-white/10 text-xs font-bold text-white border border-white/10">{{ details.info.canton }}</span>
                             <span class="text-white/60 text-sm">{{ details.info.description || 'Société de gymnastique' }}</span>
                        </div>
                    </div>
                </div>
            </div>
            </div>

            <!-- Stats -->
            <div class="px-6 py-4 grid grid-cols-2 gap-4 border-b border-white/5">
                <div class="glass-card p-4 flex flex-col items-center justify-center bg-white/5">
                     <Icon name="fluent:checkmark-circle-24-regular" class="w-6 h-6 text-cyan-400 mb-2" />
                     <div class="text-2xl font-bold text-white leading-none mb-1">
                        {{ details.stats.completedPassages }} <span class="text-sm text-white/40 font-normal">/ {{ details.stats.totalPassages }}</span>
                     </div>
                     <div class="text-xs text-white/50">Passages terminés</div>
                </div>
                <div class="glass-card p-4 flex flex-col items-center justify-center bg-white/5">
                     <Icon name="fluent:arrow-trending-24-regular" class="w-6 h-6 text-purple-400 mb-2" />
                     <div class="text-2xl font-bold text-white leading-none mb-1">{{ details.stats.currentTotalScore }}</div>
                     <div class="text-xs text-white/50">Note Moyenne</div>
                </div>
            </div>

            <!-- Timeline -->
            <div class="flex-1 overflow-y-auto p-6">
                <h3 class="text-white font-bold mb-4">Déroulement de la journée</h3>
                <div class="space-y-4 relative">
                    <!-- Vertical Line -->
                    <div class="absolute left-[19px] top-2 bottom-2 w-0.5 bg-white/10" />

                    <div 
                        v-for="item in details.timeline"
                        :key="item._id"
                        class="relative pl-12"
                    >
                        <!-- Icon Bubble -->
                        <div
                            class="absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 bg-[#0B1120]"
                            :class="item.status === 'LIVE' ? 'border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' :
                                    item.status === 'FINISHED' ? 'border-cyan-400 text-cyan-400' : 'border-white/20 text-white/40'"
                        >
                            <Icon :name="item.apparatus.icon || 'fluent:circle-24-regular'" class="w-5 h-5" />
                        </div>

                        <!-- Content Card -->
                        <div class="glass-card p-4 hover:bg-white/10 transition-colors">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <div class="font-bold text-white text-lg leading-tight mb-0.5">{{ item.apparatus.name }}</div>
                                    <div class="text-xs text-white/50 flex items-center gap-1.5">
                                        <span>{{ formatTime(item.startTime) }}</span>
                                        <span>•</span>
                                        <span>{{ item.location || 'Salle 1' }}</span>
                                    </div>
                                </div>
                                <div v-if="item.status === 'FINISHED'" class="text-right">
                                    <div class="text-2xl font-bold text-cyan-400 leading-none">{{ item.scores?.total?.toFixed(2) || '0.00' }}</div>
                                </div>
                                <div v-else-if="item.status === 'LIVE'" class="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 animate-pulse">
                                    🔴 EN COURS
                                </div>
                                <div v-else class="text-white/40 text-sm italic">
                                    À venir
                                </div>
                            </div>

                            <!-- Monitors -->
                            <div v-if="item.monitors && item.monitors.length > 0" class="flex flex-wrap gap-2 mt-3">
                                <span
                                    v-for="monitor in item.monitors"
                                    :key="monitor"
                                    class="px-2 py-1 rounded-md bg-white/5 text-white/60 text-xs border border-white/5"
                                >
                                    {{ monitor }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer Action -->
            <div class="p-6 border-t border-white/10 flex-shrink-0 bg-[#0B1120]/50 backdrop-blur-xl">
                <button
                    class="w-full gradient-cyan-purple py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                    <Icon name="fluent:heart-24-regular" class="w-5 h-5" />
                    Ajouter aux Favoris
                </button>
            </div>
        </template>
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

.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

/* Custom Scrollbar for Timeline */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
