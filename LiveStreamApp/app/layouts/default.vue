<script setup lang="ts">
import { useNotificationsStore } from '#imports'
import { useNotificationSocket } from '#imports'

interface NavItem {
  id: string
  icon: string
  iconFilled: string
  labelKey: string
  to: string
  isCenter?: boolean
}

const route = useRoute()
const notificationsStore = useNotificationsStore()
const { t, locale, locales, setLocale } = useI18n()

// PWA Install
const { isInstallAvailable, isStandalone, showInstallPrompt } = usePwaInstall()

// Setup socket listeners for real-time notifications
useNotificationSocket()

const navItems: NavItem[] = [
  { id: 'home', icon: 'fluent:home-24-regular', iconFilled: 'fluent:home-24-filled', labelKey: 'nav.home', to: '/' },
  { id: 'schedule', icon: 'fluent:calendar-24-regular', iconFilled: 'fluent:calendar-24-filled', labelKey: 'nav.schedule', to: '/schedule' },
  { id: 'stream', icon: 'fluent:play-circle-24-regular', iconFilled: 'fluent:play-circle-24-filled', labelKey: 'nav.stream', to: '/stream', isCenter: true },
  { id: 'results', icon: 'fluent:trophy-24-regular', iconFilled: 'fluent:trophy-24-filled', labelKey: 'nav.results', to: '/results' },
  { id: 'favorites', icon: 'fluent:heart-24-regular', iconFilled: 'fluent:heart-24-filled', labelKey: 'nav.favorites', to: '/favorites' }
]

const pageTitleKeys: Record<string, string> = {
  '/': 'pages.home',
  '/schedule': 'pages.schedule',
  '/stream': 'pages.stream',
  '/results': 'pages.results',
  '/favorites': 'pages.favorites'
}

const currentPageTitle = computed(() => t(pageTitleKeys[route.path] || 'pages.home'))

// Language toggle
const toggleLocale = () => {
  const newLocale = locale.value === 'fr' ? 'de' : 'fr'
  setLocale(newLocale)
}

// Page meta-based visibility for header/footer (default: shown)
const routeMeta = computed(() => (route.meta || {}) as Record<string, any>)
const showHeader = computed(() => routeMeta.value.header !== false)
const showFooter = computed(() => routeMeta.value.footer !== false)

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

// Overlay states
const isNotificationsOpen = ref(false)
const isSearchOpen = ref(false)
const isFilterOpen = ref(false)
const isGroupDetailsOpen = ref(false)
const selectedGroupId = ref('')
const selectedApparatusCode = ref<string | undefined>(undefined)

// Notifications from store
const hasUnreadNotifications = computed(() => notificationsStore.hasUnread)
const unreadCount = computed(() => notificationsStore.unreadCount)

const openSearch = () => {
  isSearchOpen.value = true
}

const openFilter = () => {
  isFilterOpen.value = true
}

const openNotifications = () => {
  isNotificationsOpen.value = true
}

const openGroupDetails = (groupId: string, apparatusCode?: string) => {
  selectedGroupId.value = groupId
  selectedApparatusCode.value = apparatusCode
  isGroupDetailsOpen.value = true
}

// Provide to child components
provide('openGroupDetails', openGroupDetails)
</script>

<template>
  <div class="relative w-full h-screen overflow-hidden">
    <!-- Animated Background -->
    <LiquidBackground />

    <div class="relative z-10">
      <!-- Glass Header with safe area support -->
      <header v-if="showHeader" class="fixed top-0 left-0 right-0 z-50 px-2 header-safe-area">
        <div class="glass-card backdrop-blur-2xl !rounded-full overflow-hidden px-4 py-2">
          <div class="flex items-center justify-between">
            <h1 class="text-white text-xl font-bold">{{ currentPageTitle }}</h1>
            
            <div class="flex items-center gap-2">
              <!-- Language Toggle Button -->
              <button 
                @click="toggleLocale"
                class="p-2 hover:bg-white/10 rounded-lg transition-colors relative flex items-center gap-1"
                :aria-label="locale === 'fr' ? 'Auf Deutsch wechseln' : 'Passer en français'"
              >
                <span class="text-white text-sm font-bold uppercase">{{ locale }}</span>
                <Icon name="fluent:globe-24-regular" class="w-4 h-4 text-white/70" />
              </button>
              
              <!-- PWA Install Button - Visible only when installation is available -->
              <Transition name="badge-pop">
                <button 
                  v-if="isInstallAvailable && !isStandalone"
                  @click="showInstallPrompt(true)"
                  class="p-2 hover:bg-white/10 rounded-lg transition-colors relative animate-pulse"
                  :aria-label="t('pwa.installApp')"
                >
                  <Icon name="fluent:arrow-download-24-regular" class="w-5 h-5 text-cyan-400" />
                </button>
              </Transition>
              
              <button 
                @click="openSearch"
                class="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
              >
                <Icon name="fluent:search-24-regular" class="w-5 h-5 text-white" />
              </button>
              
              <button 
                v-if="route.path === '/schedule'"
                @click="openFilter"
                class="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Icon name="fluent:options-24-regular" class="w-5 h-5 text-white" />
              </button>
              
              <button 
                @click="openNotifications"
                class="p-2 hover:bg-white/10 rounded-lg transition-colors relative group"
              >
                <Icon name="fluent:alert-24-regular" class="w-5 h-5 text-white" />
                <!-- Badge with count -->
                <Transition name="badge-pop">
                  <span 
                    v-if="hasUnreadNotifications"
                    class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-red-500 rounded-full text-[10px] font-bold text-white shadow-lg shadow-red-500/30 animate-pulse"
                  >
                    {{ unreadCount > 99 ? '99+' : unreadCount }}
                  </span>
                </Transition>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content Area - Scrollable -->
      <main :class="[
        'h-screen overflow-y-auto',
        showHeader ? 'main-content' : 'pt-0',
        showFooter ? 'pb-[120px]' : 'pb-0'
      ]">
        <slot />
      </main>

      <!-- Bottom Navigation Dock - Fixed with safe area support -->
      <nav v-if="showFooter" class="fixed bottom-0 left-0 right-0 z-50 px-2 nav-safe-area">
        <div class="glass-card backdrop-blur-2xl !rounded-full overflow-hidden px-3 py-2 flex items-center justify-around">
          <NuxtLink
            v-for="item in navItems"
            :key="item.id"
            :to="item.to"
            class="relative flex flex-col items-center justify-center transition-all"
            :class="{ 'scale-125': item.isCenter }"
            :aria-label="t(item.labelKey)"
          >
            <div 
              class="p-2 rounded-xl transition-all"
              :class="[
                isActive(item.to) ? 'text-cyan-400' : 'text-white/60',
                isActive(item.to) && item.isCenter ? 'glow-cyan' : '',
                isActive(item.to) && !item.isCenter ? 'bg-white/10' : ''
              ]"
            >
              <Icon 
                :name="isActive(item.to) ? item.iconFilled : item.icon"
                :class="item.isCenter ? 'w-7 h-7' : 'w-6 h-6'"
              />
            </div>
          </NuxtLink>
        </div>
      </nav>
    </div>

    <!-- Overlays -->
    <OverlaysNotificationDrawer
      :is-open="isNotificationsOpen"
      @close="isNotificationsOpen = false"
    />
    
    <OverlaysSearchOverlay
      :is-open="isSearchOpen"
      @close="isSearchOpen = false"
    />
    
    <OverlaysFilterSheet
      :is-open="isFilterOpen"
      @close="isFilterOpen = false"
    />
    
    <OverlaysGroupDetailsModal
      :is-open="isGroupDetailsOpen"
      :group-id="selectedGroupId"
      :apparatus-code="selectedApparatusCode"
      @close="isGroupDetailsOpen = false"
    />
  </div>
</template>
<style scoped>
/* Badge pop animation */
.badge-pop-enter-active {
  animation: badge-pop-in 0.3s ease-out;
}
.badge-pop-leave-active {
  animation: badge-pop-out 0.2s ease-in;
}

@keyframes badge-pop-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes badge-pop-out {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}
</style>