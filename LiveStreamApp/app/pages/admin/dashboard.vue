<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { AdminService } from '../../services/admin.service'
import { PublicService } from '../../services/public.service'
import type { PassageEnriched, Stream, PassageStatus } from '../../types/api'
import type { NotificationType } from '../../types/notifications'
import { useAdminAuth } from '../../composables/useAdminAuth'
import { useSocketRoom } from '../../composables/useSocketRoom'
import { useNotificationsStore } from '#imports'

definePageMeta({ header: false, footer: false })

const { t, locale, setLocale } = useI18n()
const { translateApparatus, translateDay, formatLocalizedTime } = useTranslatedData()
const { token: adminToken, login, logout, loginError, isLoggingIn } = useAdminAuth()
const notificationsStore = useNotificationsStore()
const passwordInput = ref('')

// ===== UI State =====
const activeView = ref<'passages' | 'streams'>('passages')
const showAdvancedFilters = ref(false)
const showMobileMenu = ref(false)
const isHeaderCollapsed = ref(false)
const searchQuery = ref('')
const searchCategory = ref<'all' | 'group' | 'apparatus' | 'location'>('all')

// ===== Quick Filters (Chips) =====
const selectedDay = ref<string>('')
const selectedApparatus = ref<string>('')

// ===== Advanced Filters =====
const advancedFilters = ref({
  hideFinished: false,
  onlyWithScore: false,
  onlyWithoutScore: false,
  status: '' as '' | PassageStatus,
  location: '',
  category: ''
})

// ===== Test Notifications =====
const showTestNotificationMenu = ref(false)
const isSendingNotification = ref(false)
const notificationResult = ref<{ success: boolean; message: string } | null>(null)
const notificationTypes: NotificationType[] = ['live', 'score', 'reminder', 'info', 'success', 'warning']

const sendTestNotification = async (type: NotificationType) => {
  isSendingNotification.value = true
  notificationResult.value = null
  
  try {
    await notificationsStore.sendTestNotification(type)
    notificationResult.value = { 
      success: true, 
      message: t('admin.notificationSent', { type })
    }
    setTimeout(() => {
      notificationResult.value = null
      showTestNotificationMenu.value = false
    }, 1500)
  } catch (e: any) {
    console.error('[Dashboard] Test notification error:', e)
    notificationResult.value = { 
      success: false, 
      message: e.message || t('admin.notificationError')
    }
  } finally {
    isSendingNotification.value = false
  }
}

const sendAllTestNotifications = async () => {
  showTestNotificationMenu.value = false
  for (let i = 0; i < notificationTypes.length; i++) {
    await notificationsStore.sendTestNotification(notificationTypes[i])
    if (i < notificationTypes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
}

// Language toggle
const toggleLocale = () => {
  const newLocale = locale.value === 'fr' ? 'de' : 'fr'
  setLocale(newLocale)
}

// Close dropdowns when clicking outside
const closeMenus = () => {
  showTestNotificationMenu.value = false
  showMobileMenu.value = false
}

onMounted(() => {
  document.addEventListener('click', closeMenus)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenus)
})

const isAuthenticated = computed(() => !!adminToken.value)

const handleLogin = async () => {
  if (passwordInput.value) {
    const success = await login(passwordInput.value)
    if (success) {
      passwordInput.value = ''
    }
  }
}

// ===== Data Fetching =====
const { data: scheduleData, refresh: refreshSchedule } = await PublicService.getSchedule()
const { data: streamsData, refresh: refreshStreams } = await PublicService.getStreams()

const passages = ref<PassageEnriched[]>([])
const streams = ref<Stream[]>([])

// ===== Computed Filter Options =====
const availableDays = computed(() => {
  return scheduleData.value?.meta?.availableDays || []
})

const availableApparatus = computed(() => {
  const seen = new Map<string, { code: string; name: string }>()
  for (const p of passages.value) {
    if (p.apparatus && !seen.has(p.apparatus.code)) {
      seen.set(p.apparatus.code, { code: p.apparatus.code, name: p.apparatus.name })
    }
  }
  return Array.from(seen.values())
})

const availableLocations = computed(() => {
  return scheduleData.value?.meta?.availableLocations || []
})

const availableCategories = computed(() => {
  return scheduleData.value?.meta?.availableCategories || []
})

// ===== Watchers =====
watch(scheduleData, (data) => {
  if (data?.data) {
    passages.value = data.data.map((p: any) => ({
      ...p,
      score: p.score ?? undefined
    }))
    if (!selectedDay.value && availableDays.value.length) {
      selectedDay.value = availableDays.value[0] || ''
    }
  }
}, { immediate: true })

watch(streamsData, (data) => {
  if (data) {
    streams.value = data
  }
}, { immediate: true })

// ===== Filtered Passages =====
const filteredPassages = computed(() => {
  let result = [...passages.value]
  
  if (selectedDay.value) {
    result = result.filter(p => {
      const passageDay = new Date(p.startTime).toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase()
      return passageDay === selectedDay.value.toLowerCase()
    })
  }
  
  if (selectedApparatus.value) {
    result = result.filter(p => p.apparatus.code === selectedApparatus.value || p.apparatus.name === selectedApparatus.value)
  }
  
  if (advancedFilters.value.hideFinished) {
    result = result.filter(p => p.status !== 'FINISHED')
  }
  
  if (advancedFilters.value.onlyWithScore) {
    result = result.filter(p => p.score !== undefined && p.score !== null)
  }
  
  if (advancedFilters.value.onlyWithoutScore) {
    result = result.filter(p => p.score === undefined || p.score === null)
  }
  
  if (advancedFilters.value.status) {
    result = result.filter(p => p.status === advancedFilters.value.status)
  }
  
  if (advancedFilters.value.location) {
    result = result.filter(p => p.location === advancedFilters.value.location)
  }
  
  if (advancedFilters.value.category) {
    result = result.filter(p => p.group.category === advancedFilters.value.category)
  }
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(p => {
      switch (searchCategory.value) {
        case 'group':
          return p.group.name.toLowerCase().includes(query)
        case 'apparatus':
          return p.apparatus.name.toLowerCase().includes(query) || 
                 p.apparatus.code.toLowerCase().includes(query)
        case 'location':
          return p.location?.toLowerCase().includes(query)
        default:
          return p.group.name.toLowerCase().includes(query) ||
                 p.apparatus.name.toLowerCase().includes(query) ||
                 p.apparatus.code.toLowerCase().includes(query) ||
                 p.location?.toLowerCase().includes(query) ||
                 p.group.category?.toLowerCase().includes(query)
      }
    })
  }
  
  return result
})

// ===== Socket Room Connection =====
// Join admin-dashboard room when authenticated
const handleStreamUpdate = (data: any) => {
  console.log('[Dashboard] Stream update received:', data)
  const idx = streams.value.findIndex(s => s._id === data._id)
  if (idx !== -1) {
    streams.value[idx] = { ...streams.value[idx], ...data }
  }
}

const handleScoreUpdate = (data: any) => {
  console.log('[Dashboard] Score update received:', data)
  const passage = passages.value.find(p => p._id === data.passageId)
  if (passage) {
    if (data.score !== undefined) passage.score = data.score
    if (data.status) passage.status = data.status
  }
}

const handleScheduleUpdate = () => {
  console.log('[Dashboard] Schedule update received, refreshing...')
  refreshSchedule()
}

// Only setup socket room when authenticated
if (isAuthenticated.value) {
  useSocketRoom(['admin-dashboard', 'streams', 'live-scores'], [
    { event: 'stream-update', handler: handleStreamUpdate },
    { event: 'score-update', handler: handleScoreUpdate },
    { event: 'schedule-update', handler: handleScheduleUpdate }
  ])
}

// ===== Actions =====
const savingScoreId = ref<string | null>(null)

const updateStatus = async (passage: PassageEnriched, status: PassageStatus) => {
  try {
    await AdminService.updateStatus({ passageId: passage._id!, status })
    passage.status = status
  } catch (e) {
    console.error('[Dashboard] Failed to update status:', e)
  }
}

const updateScore = async (passage: PassageEnriched) => {
  if (passage.score === undefined || passage.score === null) return
  
  savingScoreId.value = passage._id || null
  try {
    await AdminService.updateScore({ passageId: passage._id!, score: passage.score })
    setTimeout(() => { savingScoreId.value = null }, 1000)
  } catch (e) {
    console.error('[Dashboard] Failed to update score:', e)
    savingScoreId.value = null
  }
}

const updateStreamUrl = async (stream: Stream) => {
  try {
    await AdminService.updateStream({ streamId: stream._id!, url: stream.url, isLive: stream.isLive })
  } catch (e) {
    console.error('[Dashboard] Failed to update stream:', e)
  }
}

const getStreamForPassage = (passage: PassageEnriched) => {
  return streams.value.find(s => s.location === passage.location)
}

// ===== Helpers =====
const getStatusColor = (status?: PassageStatus) => {
  switch (status) {
    case 'SCHEDULED': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    case 'LIVE': return 'bg-red-500/20 text-red-300 border border-red-500/30'
    case 'FINISHED': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    default: return 'bg-white/10 text-white/50'
  }
}

const getStatusIcon = (status?: PassageStatus) => {
  switch (status) {
    case 'SCHEDULED': return 'fluent:calendar-clock-24-regular'
    case 'LIVE': return 'fluent:record-24-filled'
    case 'FINISHED': return 'fluent:checkmark-circle-24-filled'
    default: return 'fluent:circle-24-regular'
  }
}

const formatPassageTime = (date: Date | string) => {
  const dateStr = typeof date === 'string' ? date : date.toISOString()
  return formatLocalizedTime(dateStr)
}

const clearAllFilters = () => {
  selectedDay.value = ''
  selectedApparatus.value = ''
  advancedFilters.value = {
    hideFinished: false,
    onlyWithScore: false,
    onlyWithoutScore: false,
    status: '',
    location: '',
    category: ''
  }
  searchQuery.value = ''
  searchCategory.value = 'all'
}

const hasActiveFilters = computed(() => {
  return selectedDay.value || selectedApparatus.value || 
         advancedFilters.value.hideFinished || advancedFilters.value.onlyWithScore ||
         advancedFilters.value.onlyWithoutScore || advancedFilters.value.status ||
         advancedFilters.value.location || advancedFilters.value.category ||
         searchQuery.value.trim()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
    <!-- Login Screen -->
    <div v-if="!isAuthenticated" class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="glass-card rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl">
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 mb-6 shadow-lg">
              <Icon name="fluent:shield-checkmark-24-filled" class="w-10 h-10 text-white" />
            </div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent mb-2">
              {{ t('admin.loginTitle') || 'Admin Dashboard' }}
            </h1>
            <p class="text-white/60 text-sm">{{ t('admin.loginSubtitle') || 'Connexion sécurisée' }}</p>
          </div>
          
          <form @submit.prevent="handleLogin" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                {{ t('admin.password') || 'Mot de passe' }}
              </label>
              <input
                v-model="passwordInput"
                type="password"
                :placeholder="t('admin.enterPassword') || 'Entrez le mot de passe'"
                class="input-modern w-full"
                :disabled="isLoggingIn"
                autocomplete="current-password"
              />
            </div>
            
            <Transition name="shake">
              <div v-if="loginError" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <Icon name="fluent:error-circle-24-filled" class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p class="text-sm text-red-300">{{ loginError }}</p>
              </div>
            </Transition>
            
            <button
              type="submit"
              :disabled="isLoggingIn || !passwordInput"
              class="btn-primary w-full"
            >
              <Icon v-if="isLoggingIn" name="svg-spinners:ring-resize" class="w-5 h-5" />
              <Icon v-else name="fluent:arrow-right-24-filled" class="w-5 h-5" />
              <span>{{ isLoggingIn ? (t('admin.loggingIn') || 'Connexion...') : (t('admin.login') || 'Se connecter') }}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Main Dashboard -->
    <div v-else class="flex flex-col h-screen overflow-hidden">
      <!-- Header -->
      <header class="glass-header border-b border-white/10 backdrop-blur-xl sticky top-0 z-50">
        <div class="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16 md:h-20">
            <!-- Logo & Title -->
            <div class="flex items-center gap-3 md:gap-4">
              <div class="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg">
                <Icon name="fluent:database-24-filled" class="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div class="hidden sm:block">
                <h1 class="text-lg md:text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p class="text-xs text-white/50">{{ filteredPassages.length }} passages</p>
              </div>
            </div>
            
            <!-- Desktop Actions -->
            <div class="hidden lg:flex items-center gap-3">
              <!-- View Toggle -->
              <div class="glass-card rounded-xl p-1 flex">
                <button
                  @click="activeView = 'passages'"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  :class="activeView === 'passages' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'"
                >
                  <Icon name="fluent:people-team-24-regular" class="w-4 h-4 inline mr-2" />
                  Passages
                </button>
                <button
                  @click="activeView = 'streams'"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  :class="activeView === 'streams' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'"
                >
                  <Icon name="fluent:video-24-regular" class="w-4 h-4 inline mr-2" />
                  Streams
                </button>
              </div>
              
              <!-- Language Toggle -->
              <button @click="toggleLocale" class="btn-secondary">
                <Icon name="fluent:translate-24-regular" class="w-5 h-5" />
                <span class="hidden xl:inline">{{ locale.toUpperCase() }}</span>
              </button>
              
              <!-- Notifications Menu -->
              <div class="relative">
                <button 
                  @click.stop="showTestNotificationMenu = !showTestNotificationMenu"
                  class="btn-secondary"
                  :class="showTestNotificationMenu ? 'bg-white/20' : ''"
                >
                  <Icon name="fluent:alert-24-regular" class="w-5 h-5" />
                </button>
                
                <Transition name="dropdown">
                  <div v-if="showTestNotificationMenu" class="dropdown-menu right-0 w-64">
                    <div class="p-3 border-b border-white/10">
                      <h3 class="font-semibold text-sm">Test Notifications</h3>
                    </div>
                    <div class="p-2 space-y-1">
                      <button
                        v-for="type in notificationTypes"
                        :key="type"
                        @click="sendTestNotification(type)"
                        :disabled="isSendingNotification"
                        class="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm flex items-center justify-between"
                      >
                        <span class="capitalize">{{ type }}</span>
                        <Icon name="fluent:send-24-regular" class="w-4 h-4 opacity-50" />
                      </button>
                      <div class="border-t border-white/10 my-2"></div>
                      <button
                        @click="sendAllTestNotifications"
                        :disabled="isSendingNotification"
                        class="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm font-medium text-emerald-400"
                      >
                        Send All
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>
              
              <!-- Refresh -->
              <button @click="refreshSchedule(); refreshStreams()" class="btn-secondary">
                <Icon name="fluent:arrow-clockwise-24-regular" class="w-5 h-5" />
              </button>
              
              <!-- Logout -->
              <button @click="logout" class="btn-danger">
                <Icon name="fluent:sign-out-24-regular" class="w-5 h-5" />
                <span class="hidden xl:inline">Logout</span>
              </button>
            </div>
            
            <!-- Mobile Menu Button -->
            <button @click.stop="showMobileMenu = !showMobileMenu" class="lg:hidden btn-secondary">
              <Icon :name="showMobileMenu ? 'fluent:dismiss-24-regular' : 'fluent:navigation-24-regular'" class="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <!-- Mobile Menu -->
        <Transition name="slide-down">
          <div v-if="showMobileMenu" @click.stop class="lg:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-xl">
            <div class="px-4 py-4 space-y-3">
              <!-- View Toggle Mobile -->
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="activeView = 'passages'; showMobileMenu = false"
                  class="px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  :class="activeView === 'passages' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-white/5 text-white/60'"
                >
                  <Icon name="fluent:people-team-24-regular" class="w-5 h-5 mx-auto mb-1" />
                  Passages
                </button>
                <button
                  @click="activeView = 'streams'; showMobileMenu = false"
                  class="px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  :class="activeView === 'streams' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-white/5 text-white/60'"
                >
                  <Icon name="fluent:video-24-regular" class="w-5 h-5 mx-auto mb-1" />
                  Streams
                </button>
              </div>
              
              <div class="flex gap-2">
                <button @click="toggleLocale" class="flex-1 btn-secondary">
                  <Icon name="fluent:translate-24-regular" class="w-5 h-5" />
                  {{ locale.toUpperCase() }}
                </button>
                <button @click="refreshSchedule(); refreshStreams()" class="flex-1 btn-secondary">
                  <Icon name="fluent:arrow-clockwise-24-regular" class="w-5 h-5" />
                  Refresh
                </button>
              </div>
              
              <button @click="logout" class="w-full btn-danger">
                <Icon name="fluent:sign-out-24-regular" class="w-5 h-5" />
                Déconnexion
              </button>
            </div>
          </div>
        </Transition>
      </header>
      
      <!-- Filters Section -->
      <div v-if="activeView === 'passages'" class="glass-header border-b border-white/10 backdrop-blur-xl sticky top-16 md:top-20 z-40">
        <div class="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <!-- Search Bar -->
          <div class="mb-4">
            <div class="relative">
              <Icon name="fluent:search-24-regular" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none z-10" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('admin.searchPlaceholder') || 'Rechercher...'"
                class="w-full bg-white/5 border border-white/15 rounded-xl pl-12 pr-32 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-all"
              />
              <select
                v-model="searchCategory"
                class="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-800 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="all" class="bg-slate-800 text-white">Tout</option>
                <option value="group" class="bg-slate-800 text-white">Groupe</option>
                <option value="apparatus" class="bg-slate-800 text-white">Appareil</option>
                <option value="location" class="bg-slate-800 text-white">Lieu</option>
              </select>
            </div>
          </div>
          
          <!-- Quick Filters -->
          <div class="flex flex-wrap items-center gap-2 mb-3">
            <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 pb-2">
              <!-- Days -->
              <button
                v-for="day in availableDays"
                :key="day"
                @click="selectedDay = selectedDay === day ? '' : day"
                class="chip-day whitespace-nowrap"
                :class="selectedDay === day ? 'chip-day-active' : ''"
              >
                <Icon name="fluent:calendar-24-regular" class="w-4 h-4" />
                {{ translateDay(day) }}
              </button>
              
              <span class="text-white/20 mx-1">|</span>
              
              <!-- Apparatus -->
              <button
                v-for="app in availableApparatus"
                :key="app.code"
                @click="selectedApparatus = selectedApparatus === app.code ? '' : app.code"
                class="chip-apparatus whitespace-nowrap"
                :class="selectedApparatus === app.code ? 'chip-apparatus-active' : ''"
              >
                {{ translateApparatus(app.code, app.name) }}
              </button>
            </div>
            
            <!-- Advanced Filters Toggle -->
            <button
              @click="showAdvancedFilters = !showAdvancedFilters"
              class="btn-secondary flex-shrink-0"
              :class="showAdvancedFilters ? 'bg-white/20' : ''"
            >
              <Icon name="fluent:filter-24-regular" class="w-5 h-5" />
              <span class="hidden sm:inline">Filtres</span>
            </button>
            
            <!-- Clear Filters -->
            <button
              v-if="hasActiveFilters"
              @click="clearAllFilters"
              class="btn-secondary flex-shrink-0 text-red-400 hover:bg-red-500/20"
            >
              <Icon name="fluent:dismiss-24-regular" class="w-5 h-5" />
              <span class="hidden sm:inline">Reset</span>
            </button>
          </div>
          
          <!-- Advanced Filters Panel -->
          <Transition name="slide-down">
            <div v-if="showAdvancedFilters" class="glass-card rounded-2xl p-4 space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Status Filter -->
                <div>
                  <label class="block text-xs font-medium text-white/60 mb-2">Statut</label>
                  <select v-model="advancedFilters.status" class="select-modern w-full text-sm">
                    <option value="" class="bg-slate-800">Tous</option>
                    <option value="SCHEDULED" class="bg-slate-800">Planifié</option>
                    <option value="LIVE" class="bg-slate-800">En direct</option>
                    <option value="FINISHED" class="bg-slate-800">Terminé</option>
                  </select>
                </div>
                
                <!-- Location Filter -->
                <div>
                  <label class="block text-xs font-medium text-white/60 mb-2">Lieu</label>
                  <select v-model="advancedFilters.location" class="select-modern w-full text-sm">
                    <option value="" class="bg-slate-800">Tous</option>
                    <option v-for="loc in availableLocations" :key="loc" :value="loc" class="bg-slate-800">{{ loc }}</option>
                  </select>
                </div>
                
                <!-- Category Filter -->
                <div>
                  <label class="block text-xs font-medium text-white/60 mb-2">Catégorie</label>
                  <select v-model="advancedFilters.category" class="select-modern w-full text-sm">
                    <option value="" class="bg-slate-800">Toutes</option>
                    <option v-for="cat in availableCategories" :key="cat" :value="cat" class="bg-slate-800">{{ cat }}</option>
                  </select>
                </div>
              </div>
              
              <!-- Toggle Filters -->
              <div class="flex flex-wrap gap-3">
                <label class="toggle-label">
                  <input type="checkbox" v-model="advancedFilters.hideFinished" class="sr-only peer" />
                  <div class="toggle-switch"></div>
                  <span class="text-sm">Masquer terminés</span>
                </label>
                
                <label class="toggle-label">
                  <input type="checkbox" v-model="advancedFilters.onlyWithScore" class="sr-only peer" />
                  <div class="toggle-switch"></div>
                  <span class="text-sm">Avec score uniquement</span>
                </label>
                
                <label class="toggle-label">
                  <input type="checkbox" v-model="advancedFilters.onlyWithoutScore" class="sr-only peer" />
                  <div class="toggle-switch"></div>
                  <span class="text-sm">Sans score uniquement</span>
                </label>
              </div>
            </div>
          </Transition>
        </div>
      </div>
      
      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto">
        <div class="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <!-- Passages View -->
          <div v-if="activeView === 'passages'" class="space-y-4">
            <!-- Empty State -->
            <div v-if="filteredPassages.length === 0" class="text-center py-16">
              <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/5 mb-6">
                <Icon name="fluent:search-24-regular" class="w-12 h-12 text-white/30" />
              </div>
              <h3 class="text-xl font-semibold text-white/60 mb-2">Aucun passage trouvé</h3>
              <p class="text-white/40 mb-6">Essayez de modifier vos filtres</p>
              <button @click="clearAllFilters" class="btn-secondary">
                <Icon name="fluent:arrow-reset-24-regular" class="w-5 h-5" />
                Réinitialiser les filtres
              </button>
            </div>
            
            <!-- Passages Cards -->
            <TransitionGroup name="list" tag="div" class="space-y-3">
              <article
                v-for="passage in filteredPassages"
                :key="passage._id"
                class="passage-card"
              >
                <!-- Card Header -->
                <div class="p-4 sm:p-5 flex items-start gap-4">
                  <!-- Time Badge -->
                  <div class="flex-shrink-0 text-center min-w-[70px]">
                    <div class="text-xs font-medium text-white/50 mb-1">
                      {{ formatPassageTime(passage.startTime).split(' ')[0] }}
                    </div>
                    <div class="text-2xl font-bold text-cyan-300">
                      {{ formatPassageTime(passage.startTime).split(' ')[1] }}
                    </div>
                    <div class="text-xs text-white/30 mt-1">
                      {{ formatPassageTime(passage.endTime).split(' ')[1] }}
                    </div>
                  </div>
                  
                  <!-- Info Column -->
                  <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-lg leading-tight truncate mb-2">{{ passage.group.name }}</h3>
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                      <span class="inline-flex items-center gap-1.5 text-purple-300">
                        <Icon :name="passage.apparatus.icon || 'fluent:sport-24-regular'" class="w-4 h-4" />
                        <span class="font-medium">{{ translateApparatus(passage.apparatus.code, passage.apparatus.name) }}</span>
                      </span>
                      <span class="text-white/30">•</span>
                      <span class="text-white/60">{{ passage.location }}</span>
                      <span v-if="passage.group.category" class="text-white/30">•</span>
                      <span v-if="passage.group.category" class="px-2 py-0.5 rounded-full bg-white/10 text-white/50 text-xs">
                        {{ passage.group.category }}
                      </span>
                    </div>
                  </div>
                  
                  <!-- Status Badge -->
                  <div
                    class="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                    :class="getStatusColor(passage.status)"
                  >
                    <Icon :name="getStatusIcon(passage.status)" class="w-4 h-4" />
                    <span class="hidden sm:inline">{{ passage.status }}</span>
                  </div>
                </div>
                
                <!-- Actions Section -->
                <div class="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
                  <!-- Status Controls -->
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="status in (['SCHEDULED', 'LIVE', 'FINISHED'] as PassageStatus[])"
                      :key="status"
                      @click="updateStatus(passage, status)"
                      class="flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                      :class="passage.status === status 
                        ? getStatusColor(status) 
                        : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'"
                    >
                      {{ status }}
                    </button>
                  </div>
                  
                  <!-- Score Input Section -->
                  <div class="glass-card rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <label class="text-sm font-medium text-white/60 flex-shrink-0">
                      Score de la performance
                    </label>
                    <div class="flex items-center gap-3 flex-1 justify-end w-full sm:w-auto">
                      <div class="relative flex-1 sm:flex-initial">
                        <input
                          v-model.number="passage.score"
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          placeholder="0.00"
                          class="score-input"
                          :class="savingScoreId === passage._id ? 'border-emerald-400 bg-emerald-500/10' : ''"
                          @keyup.enter="updateScore(passage)"
                        />
                        <Transition name="fade">
                          <Icon 
                            v-if="savingScoreId === passage._id" 
                            name="fluent:checkmark-circle-24-filled" 
                            class="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-400" 
                          />
                        </Transition>
                      </div>
                      <button
                        @click="updateScore(passage)"
                        :disabled="passage.score === undefined || passage.score === null"
                        class="btn-save"
                        :class="passage.score !== undefined && passage.score !== null 
                          ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/30' 
                          : 'opacity-30 cursor-not-allowed'"
                      >
                        <Icon name="fluent:save-24-regular" class="w-5 h-5" />
                        <span class="hidden sm:inline">Sauvegarder</span>
                      </button>
                    </div>
                  </div>
                  
                  <!-- Stream Link (if available) -->
                  <div v-if="getStreamForPassage(passage)" class="glass-card rounded-xl p-4 flex items-center gap-3">
                    <Icon name="fluent:video-24-regular" class="w-5 h-5 text-white/40 flex-shrink-0" />
                    <input
                      :value="getStreamForPassage(passage)?.url"
                      @input="(e) => getStreamForPassage(passage)!.url = (e.target as HTMLInputElement).value"
                      class="flex-1 bg-transparent text-sm text-white/70 focus:outline-none"
                      placeholder="URL du stream..."
                    />
                    <span
                      class="px-3 py-1 rounded-lg text-xs font-bold flex-shrink-0"
                      :class="getStreamForPassage(passage)?.isLive ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-white/10 text-white/40'"
                    >
                      {{ getStreamForPassage(passage)?.isLive ? 'LIVE' : 'OFF' }}
                    </span>
                  </div>
                </div>
              </article>
            </TransitionGroup>
          </div>
          
          <!-- Streams View -->
          <div v-if="activeView === 'streams'" class="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            <article v-for="stream in streams" :key="stream._id" class="stream-card">
              <div class="p-5 sm:p-6">
                <!-- Header -->
                <div class="flex items-start justify-between mb-6">
                  <div>
                    <h3 class="font-bold text-xl mb-2">{{ stream.name || 'Stream' }}</h3>
                    <span class="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-lg bg-white/10 text-white/60">
                      <Icon name="fluent:location-24-regular" class="w-4 h-4" />
                      {{ stream.location }}
                    </span>
                  </div>
                  <div
                    class="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                    :class="stream.isLive ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-white/10 text-white/50'"
                  >
                    <span v-if="stream.isLive" class="relative flex h-2.5 w-2.5">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-400"></span>
                    </span>
                    <span>{{ stream.isLive ? 'LIVE' : 'OFFLINE' }}</span>
                  </div>
                </div>
                
                <!-- Form -->
                <div class="space-y-5">
                  <div>
                    <label class="block text-sm font-medium text-white/60 mb-2">
                      URL YouTube du stream
                    </label>
                    <input
                      v-model="stream.url"
                      class="input-modern w-full"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  
                  <!-- Live Toggle -->
                  <div class="glass-card rounded-xl p-4 flex items-center justify-between">
                    <span class="text-sm font-medium">Stream en direct</span>
                    <label class="toggle-switch-large">
                      <input type="checkbox" v-model="stream.isLive" class="sr-only peer" />
                      <div class="toggle-bg"></div>
                    </label>
                  </div>
                  
                  <button
                    @click="updateStreamUrl(stream)"
                    class="w-full btn-primary"
                  >
                    <Icon name="fluent:save-24-regular" class="w-5 h-5" />
                    Mettre à jour le stream
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ===== Modern Design System ===== */

/* Glass Effects */
.glass-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
}

.glass-header {
  background: rgba(15, 23, 42, 0.8);
}

/* Inputs */
.input-modern {
  @apply bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/40 
         focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-all;
}

.score-input {
  @apply w-full sm:w-32 bg-black/30 border-2 border-white/20 rounded-xl px-4 py-3 text-center 
         font-bold text-xl text-white focus:outline-none focus:border-cyan-400 transition-all;
}

/* Buttons */
.btn-primary {
  @apply px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 
         hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed 
         transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2;
}

.btn-secondary {
  @apply px-4 py-2.5 rounded-xl font-medium text-white/80 bg-white/10 hover:bg-white/15 
         border border-white/10 transition-all flex items-center gap-2;
}

.btn-danger {
  @apply px-4 py-2.5 rounded-xl font-medium text-red-300 bg-red-500/20 hover:bg-red-500/30 
         border border-red-500/30 transition-all flex items-center gap-2;
}

.btn-save {
  @apply px-4 py-2.5 rounded-xl font-medium border transition-all flex items-center gap-2 flex-shrink-0;
}

/* Chips - Days (Cyan/Blue) */
.chip-day {
  @apply px-4 py-2 rounded-xl text-sm font-medium bg-cyan-500/10 text-cyan-300/80 
         hover:bg-cyan-500/20 transition-all border border-cyan-500/20 flex items-center gap-2;
}

.chip-day-active {
  @apply bg-cyan-500/30 text-cyan-200 border-cyan-400/50 shadow-lg shadow-cyan-500/20;
}

/* Chips - Apparatus (Purple) */
.chip-apparatus {
  @apply px-4 py-2 rounded-xl text-sm font-medium bg-purple-500/10 text-purple-300/80 
         hover:bg-purple-500/20 transition-all border border-purple-500/20;
}

.chip-apparatus-active {
  @apply bg-purple-500/30 text-purple-200 border-purple-400/50 shadow-lg shadow-purple-500/20;
}

/* Generic Chip */
.chip {
  @apply px-4 py-2 rounded-xl text-sm font-medium bg-white/10 text-white/70 
         hover:bg-white/15 transition-all border border-white/10;
}

.chip-active {
  @apply bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/25;
}

/* Selects */
.select-modern {
  @apply bg-slate-800 border border-white/15 rounded-xl px-4 py-3 text-white 
         focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all cursor-pointer;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

/* Toggle Switch */
.toggle-label {
  @apply flex items-center gap-3 cursor-pointer;
}

.toggle-switch {
  @apply w-11 h-6 bg-white/10 rounded-full relative 
         peer-checked:bg-cyan-500 transition-colors
         after:content-[''] after:absolute after:top-0.5 after:left-0.5 
         after:bg-white after:rounded-full after:h-5 after:w-5 
         after:transition-transform peer-checked:after:translate-x-5;
}

.toggle-switch-large {
  @apply relative inline-flex cursor-pointer;
}

.toggle-bg {
  @apply w-14 h-7 bg-white/10 rounded-full 
         peer-checked:bg-emerald-500 transition-colors
         after:content-[''] after:absolute after:top-1 after:left-1 
         after:bg-white after:rounded-full after:h-5 after:w-5 
         after:transition-transform peer-checked:after:translate-x-7 after:shadow-md;
}

/* Cards */
.passage-card {
  @apply bg-gradient-to-br from-white/10 to-white/5 border border-white/10 
         rounded-2xl backdrop-blur-md hover:border-white/20 transition-all 
         shadow-lg hover:shadow-2xl;
}

.stream-card {
  @apply bg-gradient-to-br from-white/10 to-white/5 border border-white/10 
         rounded-2xl backdrop-blur-md hover:border-cyan-500/30 transition-all 
         shadow-lg hover:shadow-2xl;
}

/* Dropdown Menu */
.dropdown-menu {
  @apply absolute mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 
         rounded-2xl shadow-2xl overflow-hidden z-50;
}

/* Scrollbar */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* ===== Animations ===== */

/* Dropdown */
.dropdown-enter-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.dropdown-leave-active {
  transition: all 0.2s ease-in;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.92);
}

/* Slide Down */
.slide-down-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.slide-down-leave-active {
  transition: all 0.25s ease-in;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
  max-height: 0;
}

/* Fade */
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

/* Shake */
.shake-enter-active {
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
  20%, 40%, 60%, 80% { transform: translateX(8px); }
}

/* List Transition */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.list-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.list-leave-active {
  position: absolute;
  width: 100%;
}

/* ===== Responsive Enhancements ===== */

@media (max-width: 640px) {
  .passage-card {
    @apply rounded-xl;
  }
  
  .stream-card {
    @apply rounded-xl;
  }
}

/* Touch-friendly tap highlights */
@media (hover: none) {
  button:active {
    transform: scale(0.97);
  }
}

/* Smooth scroll */
html {
  scroll-behavior: smooth;
}

/* Focus visible for accessibility */
:focus-visible {
  @apply outline-2 outline-offset-2 outline-cyan-400;
}
</style>