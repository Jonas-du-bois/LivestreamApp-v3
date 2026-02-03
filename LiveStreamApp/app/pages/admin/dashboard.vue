<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { AdminService } from '../../services/admin.service'
import { PublicService } from '../../services/public.service'
import type { PassageEnriched, Stream, PassageStatus } from '../../types/api'
import type { NotificationType } from '../../types/notifications'
import { useAdminAuth } from '../../composables/useAdminAuth'
import { useSocket } from '../../composables/useSocket'
import { useNotificationsStore } from '#imports'

definePageMeta({ header: false, footer: false })

const { token: adminToken, login, logout, loginError, isLoggingIn } = useAdminAuth()
const notificationsStore = useNotificationsStore()
const passwordInput = ref('')

// Test notifications state
const showTestNotificationMenu = ref(false)
const isSendingNotification = ref(false)
const notificationResult = ref<{ success: boolean; message: string } | null>(null)
const notificationTypes: NotificationType[] = ['live', 'score', 'reminder', 'info', 'success', 'warning']

/**
 * Envoie UNE notification de test unifiée (in-app + navigateur)
 */
const sendTestNotification = async (type: NotificationType) => {
  isSendingNotification.value = true
  notificationResult.value = null
  
  try {
    // Envoie la notification via le store (in-app + navigateur)
    await notificationsStore.sendTestNotification(type)
    
    notificationResult.value = { 
      success: true, 
      message: `Notification "${type}" envoyée !`
    }
    
    // Auto-hide result after 2s
    setTimeout(() => {
      notificationResult.value = null
    }, 2000)
  } catch (e: any) {
    notificationResult.value = { 
      success: false, 
      message: e.message || 'Erreur lors de l\'envoi'
    }
  } finally {
    isSendingNotification.value = false
    showTestNotificationMenu.value = false
  }
}

/**
 * Envoie toutes les notifications de test une par une
 */
const sendAllTestNotifications = async () => {
  showTestNotificationMenu.value = false
  
  for (let i = 0; i < notificationTypes.length; i++) {
    await notificationsStore.sendTestNotification(notificationTypes[i])
    // Petit délai entre chaque pour l'effet visuel
    if (i < notificationTypes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
}

// Close dropdown when clicking outside
const closeTestMenu = () => {
  showTestNotificationMenu.value = false
}

onMounted(() => {
  document.addEventListener('click', closeTestMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeTestMenu)
})

const isAuthenticated = computed(() => !!adminToken.value)

const handleLogin = async () => {
  if (passwordInput.value) {
    const success = await login(passwordInput.value)
    if (success) {
      passwordInput.value = '' // Clear password only on success
    }
  }
}

// Data Fetching (Smart Fetching Pattern)
const { data: scheduleData, refresh: refreshSchedule } = await PublicService.getSchedule()
const { data: streamsData, refresh: refreshStreams } = await PublicService.getStreams()

// Mutable State for editing
const passages = ref<PassageEnriched[]>([])
const streams = ref<Stream[]>([])
const selectedLocation = ref<string>('Tout')

// Populate local state when API data changes
watch(scheduleData, (data) => {
  if (data?.data) {
    passages.value = data.data.map((p: any) => ({
      ...p,
      score: p.score ?? undefined
    }))
  }
}, { immediate: true })

watch(streamsData, (data) => {
  if (data) {
    streams.value = data
  }
}, { immediate: true })

const locations = computed(() => {
  return ['Tout', ...(scheduleData.value?.meta?.availableLocations || [])]
})

const filteredPassages = computed(() => {
  if (selectedLocation.value === 'Tout') return passages.value
  return passages.value.filter(p => p.location === selectedLocation.value)
})

const refreshAll = async () => {
  await Promise.all([refreshSchedule(), refreshStreams()])
}

const handleReseed = async () => {
  if (!confirm('⚠️ ATTENTION ⚠️\n\nCela va EFFACER toute la base de données et regénérer des données de test fraîches (live maintenant).\n\nÊtes-vous sûr de vouloir continuer ?')) {
    return
  }

  try {
    const res = await AdminService.seedDatabase()
    if (res && res.success) {
      alert(`Database reseeded!\nPassages: ${res.summary.passages}\nStreams: ${res.summary.streams}`)
      await refreshAll()
    }
  } catch (e) {
    handleAuthError(e)
  }
}

// Helper to find stream for passage
const getStreamForPassage = (passage: PassageEnriched): Stream | undefined => {
  // Match stream.location avec passage.location (ex: "Iles 1-2", "Léon-Michaud")
  return streams.value.find(s => s.location === passage.location)
}

// Common Error Handler
const handleAuthError = (e: any) => {
  console.error('Operation failed:', e)
  if (e.statusCode === 401 || e.response?.status === 401) {
    alert('Session expired. Please log in again.')
    logout()
  } else {
    alert('An error occurred: ' + (e.message || 'Unknown error'))
  }
}

// Actions
const updateStatus = async (passage: PassageEnriched, status: PassageStatus) => {
  try {
    await AdminService.updateStatus({ passageId: passage._id!, status })
    passage.status = status
  } catch (e) {
    handleAuthError(e)
  }
}

const updateScore = async (passage: PassageEnriched) => {
  if (passage.score === undefined || passage.score === null) return
  try {
    await AdminService.updateScore({
      passageId: passage._id!,
      score: passage.score
    })
    alert('Score saved')
  } catch (e) {
    handleAuthError(e)
  }
}

const updateStreamUrl = async (stream: Stream) => {
  if (!stream._id) return
  try {
    await AdminService.updateStream({
      streamId: stream._id,
      url: stream.url,
      isLive: stream.isLive
    })
    alert('Stream updated')
  } catch (e) {
    handleAuthError(e)
  }
}

const handleStreamUpdate = (updatedStream: Partial<Stream>) => {
  const idx = streams.value.findIndex(s => s._id === updatedStream._id)
  if (idx !== -1) {
      const s = streams.value[idx]
      if (!s) return
      if (updatedStream.url !== undefined) s.url = updatedStream.url
      if (updatedStream.isLive !== undefined) s.isLive = updatedStream.isLive
      if (updatedStream.currentPassage !== undefined) s.currentPassage = updatedStream.currentPassage
  }
}

const handleScoreUpdate = (payload: any) => {
  // payload: { passageId, groupName, apparatusCode, score, rank }
  const p = passages.value.find(p => p._id === payload.passageId)
  if (p) {
      if (payload.score !== undefined) p.score = payload.score
      if (payload.status) p.status = payload.status
  }
}

// Use the composable for proper socket room management
useSocketRoom(['streams', 'live-scores', 'schedule-updates'], [
  { event: 'stream-update', handler: handleStreamUpdate },
  { event: 'score-update', handler: handleScoreUpdate },
  { event: 'schedule-update', handler: refreshAll }
])
</script>

<template>
  <div class="min-h-screen p-4 md:p-8 text-white">
    <div v-if="!isAuthenticated" class="max-w-md mx-auto mt-20 glass-panel p-8 rounded-3xl text-center">
      <h1 class="text-2xl font-bold mb-6">Admin Login</h1>
      <input
        v-model="passwordInput"
        type="password"
        placeholder="Mot de passe Administrateur"
        class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white mb-4 focus:outline-none focus:border-cyan-400"
        :disabled="isLoggingIn"
        @keyup.enter="handleLogin"
      />
      <p v-if="loginError" class="text-red-400 text-sm mb-4">{{ loginError }}</p>
      <button
        @click="handleLogin"
        :disabled="isLoggingIn"
        class="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isLoggingIn">Connexion...</span>
        <span v-else>Login</span>
      </button>
    </div>

    <div v-else>
      <header class="flex justify-between items-center mb-8 fixed top-0 left-4 right-4 bg-[#0B1120]/80 backdrop-blur-md z-50 p-4 -mx-4 rounded-b-2xl">
        <h1 class="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
        <div class="flex items-center gap-4">
          <div class="flex gap-2">
             <!-- Test Notifications Button with Dropdown -->
             <div class="relative" @click.stop>
               <button 
                 @click="showTestNotificationMenu = !showTestNotificationMenu" 
                 class="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 px-4 py-2 rounded-lg transition-colors border border-purple-500/20 flex items-center gap-2"
               >
                 <Icon name="fluent:alert-24-regular" class="w-4 h-4" />
                 Test Notif
               </button>
               
               <!-- Dropdown Menu -->
               <Transition name="dropdown">
                 <div 
                   v-if="showTestNotificationMenu" 
                   class="absolute top-full right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                 >
                   <div class="p-3">
                     <p class="text-xs text-white/40 px-2 py-2 font-medium uppercase tracking-wider flex items-center gap-2">
                       <Icon name="fluent:alert-24-regular" class="w-3 h-3" />
                       Tester les notifications
                     </p>
                     <p class="text-xs text-white/30 px-2 mb-3">
                       Envoie une notification (in-app + navigateur)
                     </p>
                     
                     <div class="space-y-1">
                       <button
                         v-for="type in notificationTypes"
                         :key="type"
                         :disabled="isSendingNotification"
                         @click="sendTestNotification(type)"
                         class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors capitalize disabled:opacity-50"
                       >
                         <span 
                           class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                           :class="{
                             'bg-cyan-400': type === 'info',
                             'bg-emerald-400': type === 'success',
                             'bg-amber-400': type === 'warning',
                             'bg-red-400': type === 'live',
                             'bg-purple-400': type === 'score',
                             'bg-orange-400': type === 'reminder'
                           }"
                         />
                         <span class="flex-1 text-left">{{ type }}</span>
                         <Icon v-if="isSendingNotification" name="fluent:spinner-ios-20-regular" class="w-4 h-4 animate-spin" />
                       </button>
                     </div>
                     
                     <hr class="border-white/10 my-3" />
                     
                     <button
                       :disabled="isSendingNotification"
                       @click="sendAllTestNotifications"
                       class="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors font-medium disabled:opacity-50"
                     >
                       <Icon name="fluent:flash-24-regular" class="w-4 h-4" />
                       Envoyer toutes (6)
                     </button>
                     
                     <!-- Result feedback -->
                     <Transition name="fade">
                       <div 
                         v-if="notificationResult" 
                         class="mt-3 p-2 rounded-lg text-xs text-center"
                         :class="notificationResult.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'"
                       >
                         {{ notificationResult.message }}
                       </div>
                     </Transition>
                   </div>
                 </div>
               </Transition>
             </div>
             
             <button @click="handleReseed" class="bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 px-4 py-2 rounded-lg transition-colors border border-yellow-500/20">Reseed DB</button>
             <button @click="refreshAll" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">Refresh</button>
             <button @click="logout" class="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors">Logout</button>
          </div>
        </div>
      </header>

      <!-- Streams Section -->
      <section class="mb-12 pt-24">
        <h2 class="text-xl font-bold mb-4 text-cyan-400">Streams Management</h2>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="stream in streams" :key="stream._id" class="glass-panel p-6 rounded-2xl">
            <h3 class="font-bold mb-2 flex justify-between">
              {{ stream.name || 'Unnamed Stream' }}
              <span class="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded">{{ stream.location }}</span>
            </h3>
            <div class="space-y-4">
              <div>
                <label class="text-xs text-white/60 block mb-1">YouTube/Video URL</label>
                <input
                  v-model="stream.url"
                  class="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-cyan-400"
                />
              </div>
              
              <!-- Ultra Modern Liquid Glass Toggle Switch -->
              <div class="flex items-center justify-between py-2">
                <div class="flex flex-col">
                  <span class="text-sm font-semibold text-white/90 mb-0.5">Stream Live</span>
                  <span class="text-xs text-white/40">
                    {{ stream.isLive ? 'Broadcasting now' : 'Currently offline' }}
                  </span>
                </div>
                
                <label class="relative inline-block w-16 h-8 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="stream.isLive"
                    :id="`live-${stream._id}`"
                    class="peer sr-only"
                  />
                  
                  <!-- Switch Background -->
                  <span
                    class="
                      absolute inset-0 rounded-full
                      bg-gradient-to-br from-white/5 to-white/10
                      backdrop-blur-xl
                      border border-white/20
                      shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]
                      transition-all duration-500 ease-out
                      peer-hover:border-white/30
                      peer-hover:shadow-[inset_0_2px_12px_rgba(0,0,0,0.4)]
                      peer-checked:bg-gradient-to-br peer-checked:from-emerald-400/30 peer-checked:to-green-500/40
                      peer-checked:border-emerald-400/60
                      peer-checked:shadow-[inset_0_2px_8px_rgba(16,185,129,0.2),0_0_24px_rgba(16,185,129,0.3)]
                      peer-focus:ring-2 peer-focus:ring-cyan-400/50 peer-focus:ring-offset-2 peer-focus:ring-offset-[#0B1120]
                    "
                  ></span>
                  
                  <!-- Sliding Orb -->
                  <span
                    class="
                      absolute top-1 left-1 w-6 h-6 rounded-full
                      bg-gradient-to-br from-white via-white/95 to-white/90
                      shadow-[0_2px_8px_rgba(0,0,0,0.3),0_0_2px_rgba(255,255,255,0.8)]
                      transition-all duration-500 ease-out
                      peer-checked:translate-x-8
                      peer-checked:bg-gradient-to-br peer-checked:from-emerald-300 peer-checked:via-emerald-200 peer-checked:to-green-300
                      peer-checked:shadow-[0_2px_12px_rgba(16,185,129,0.6),0_0_16px_rgba(16,185,129,0.4),inset_0_1px_2px_rgba(255,255,255,0.5)]
                    "
                  >
                    <!-- Inner Glow Effect -->
                    <span
                      v-if="stream.isLive"
                      class="
                        absolute inset-0 rounded-full
                        bg-gradient-to-br from-emerald-200/60 to-transparent
                        animate-pulse-glow
                      "
                    ></span>
                  </span>
                  
                  <!-- Background Icons/Indicators -->
                  <span class="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                    <!-- OFF indicator -->
                    <svg
                      class="w-3 h-3 text-white/30 transition-opacity duration-300 peer-checked:opacity-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
                    </svg>
                    <!-- ON indicator -->
                    <svg
                      class="w-3 h-3 text-emerald-300/80 transition-opacity duration-300 opacity-0 peer-checked:opacity-100 ml-auto"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </span>
                </label>
              </div>

              <!-- Animated Status Badge -->
              <div class="relative overflow-hidden rounded-xl">
                <div
                  class="
                    px-4 py-2.5 text-center font-medium text-sm
                    transition-all duration-500
                    backdrop-blur-sm
                  "
                  :class="stream.isLive 
                    ? 'bg-gradient-to-r from-emerald-500/20 via-green-500/15 to-emerald-500/20 text-emerald-200 border border-emerald-400/30' 
                    : 'bg-white/5 text-white/50 border border-white/10'"
                >
                  <div class="flex items-center justify-center gap-2">
                    <!-- Animated Live Dot -->
                    <span
                      v-if="stream.isLive"
                      class="relative flex h-2.5 w-2.5"
                    >
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                    </span>
                    <span v-else class="w-2.5 h-2.5 rounded-full bg-white/20"></span>
                    
                    <span class="font-bold tracking-wide">
                      {{ stream.isLive ? 'LIVE STREAMING' : 'OFFLINE' }}
                    </span>
                  </div>
                </div>
                
                <!-- Animated Background Effect for Live State -->
                <div
                  v-if="stream.isLive"
                  class="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent"
                  style="
                    animation: shimmer 2s infinite;
                    transform: translateX(-100%);
                  "
                ></div>
              </div>

              <button
                @click="updateStreamUrl(stream)"
                class="w-full bg-white/10 hover:bg-white/20 py-2.5 rounded-lg text-sm font-medium transition-all hover:shadow-lg"
              >
                Update Stream
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Passages Section -->
      <section>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-cyan-400">Passages ({{ filteredPassages.length }})</h2>
          <select
            v-model="selectedLocation"
            class="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
          >
            <option v-for="loc in locations" :key="loc" :value="loc" class="bg-slate-900">{{ loc }}</option>
          </select>
        </div>
        <div class="space-y-4">
          <div v-for="passage in filteredPassages" :key="passage._id" class="glass-panel p-4 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <!-- Info -->
            <div class="lg:w-1/4 w-full">
              <div class="text-xs text-cyan-400 font-bold uppercase">{{ passage.startTime }} - {{ passage.endTime }}</div>
              <div class="font-bold text-lg leading-tight mb-1">{{ passage.group.name }}</div>
              <div class="text-sm text-white/60 flex items-center gap-2">
                <Icon :name="passage.apparatus.icon" class="w-4 h-4" />
                {{ passage.apparatus.name }}
              </div>
            </div>

            <!-- Status -->
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-for="status in ['SCHEDULED', 'LIVE', 'FINISHED']"
                :key="status"
                @click="updateStatus(passage, status as PassageStatus)"
                class="px-3 py-1 rounded-full text-xs font-bold transition-all"
                :class="passage.status === status ? (status === 'LIVE' ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]') : 'bg-white/5 text-white/40 hover:bg-white/10'"
              >
                {{ status }}
              </button>
            </div>

            <!-- Scores -->
            <div class="flex items-center gap-2 flex-1 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
               <div class="flex flex-col">
                 <label class="text-[10px] text-white/40 text-center">Note Finale</label>
                <input v-model.number="passage.score" step="0.01" max="10" class="w-24 bg-black/20 border border-white/10 rounded-lg p-1.5 text-sm text-center font-bold focus:border-cyan-400" />
              </div>
              <button @click="updateScore(passage)" class="mt-3 bg-green-500/20 text-green-400 hover:bg-green-500/30 p-2 rounded-lg transition-colors" title="Save Score">
                <Icon name="fluent:save-24-regular" class="w-5 h-5" />
              </button>
            </div>

            <!-- Stream Quick Action -->
            <div class="lg:w-1/4 w-full bg-white/5 p-3 rounded-xl border border-white/5">
               <div class="text-[10px] text-white/40 mb-1 flex justify-between">
                 <span>Stream URL</span>
                 <span v-if="getStreamForPassage(passage)" class="text-cyan-400/80">{{ getStreamForPassage(passage)?.name }}</span>
                 <span v-else class="text-red-400/80">No Stream</span>
               </div>
               <div class="flex gap-2">
                 <input
                   v-if="getStreamForPassage(passage)"
                   :value="getStreamForPassage(passage)?.url"
                   @input="(e) => getStreamForPassage(passage)!.url = (e.target as HTMLInputElement).value"
                   class="w-full bg-black/40 border border-white/10 rounded-lg p-1.5 text-xs text-white/80 focus:border-cyan-400"
                   placeholder="URL"
                 />
                 <div v-else class="text-xs text-white/40 italic flex items-center justify-center w-full">
                    No matching stream found
                 </div>
                 <button
                   v-if="getStreamForPassage(passage)"
                   @click="updateStreamUrl(getStreamForPassage(passage)!)"
                   class="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                   title="Update Stream URL"
                 >
                   <Icon name="fluent:arrow-sync-24-regular" class="w-4 h-4" />
                 </button>
               </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Dropdown animation */
.dropdown-enter-active {
  transition: all 0.2s ease-out;
}
.dropdown-leave-active {
  transition: all 0.15s ease-in;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

/* Fade animation */
.fade-enter-active {
  transition: opacity 0.3s ease;
}
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>