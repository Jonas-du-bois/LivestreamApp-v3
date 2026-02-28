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

// téléportation vers le haut de la page à chaque changement de route
watch(route, () => {
  const mainContent = document.querySelector('.main-content') as HTMLElement
  if (!mainContent) return

  const startY = mainContent.scrollTop
  if (startY === 0) return

  const duration = 600
  const startTime = performance.now()

  // Ease-out cubic : démarre vite, ralentit élégamment
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

  const animateScroll = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeOutCubic(progress)

    mainContent.scrollTop = startY * (1 - eased)

    if (progress < 1) {
      requestAnimationFrame(animateScroll)
    }
  }

  requestAnimationFrame(animateScroll)
})

// PWA Install
const { isInstallAvailable, isStandalone, showInstallPrompt } = usePwaInstall()

// Setup socket listeners for real-time notifications
useNotificationSocket()

const mainNavItems: NavItem[] = [
  { id: 'home', icon: 'fluent:home-24-regular', iconFilled: 'fluent:home-24-filled', labelKey: 'nav.home', to: '/' },
  { id: 'schedule', icon: 'fluent:calendar-24-regular', iconFilled: 'fluent:calendar-24-filled', labelKey: 'nav.schedule', to: '/schedule' },
  { id: 'stream', icon: 'fluent:play-circle-24-regular', iconFilled: 'fluent:play-circle-24-filled', labelKey: 'nav.stream', to: '/stream', isCenter: true },
  { id: 'results', icon: 'fluent:trophy-24-regular', iconFilled: 'fluent:trophy-24-filled', labelKey: 'nav.results', to: '/results' }
]

const separatedNavItem: NavItem = { id: 'favorites', icon: 'fluent:heart-24-regular', iconFilled: 'fluent:heart-24-filled', labelKey: 'nav.favorites', to: '/favorites' }

const pageTitleKeys: Record<string, string> = {
  '/': 'pages.home',
  '/schedule': 'pages.schedule',
  '/stream': 'pages.stream',
  '/results': 'pages.results',
  '/favorites': 'pages.favorites',
  '/weather': 'pages.weather',
  '/infos': 'pages.info'
}

const currentPageTitle = computed(() => t(pageTitleKeys[route.path] || 'pages.home'))

const availableLocaleCodes = computed(() =>
  locales.value
    .map((localeOption) => (typeof localeOption === 'string' ? localeOption : localeOption.code))
    .filter((code) => Boolean(code))
)

// Language toggle
const toggleLocale = () => {
  const codes = availableLocaleCodes.value
  if (!codes.length) return

  const currentIndex = codes.indexOf(locale.value)
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % codes.length
  setLocale(codes[nextIndex]!)
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

// Group Details State (Global)
const {
  isOpen: isGroupDetailsOpen,
  groupId: selectedGroupId,
  apparatusCode: selectedApparatusCode,
  close: closeGroupDetails
} = useGroupDetails()

// Notifications from store
const hasUnreadNotifications = computed(() => notificationsStore.hasUnread)
const unreadCount = computed(() => notificationsStore.unreadCount)

const refreshApp = () => {
  if (window && 'beforeinstallprompt' in window) {
    window.location.reload()
  } else {
    window.location.reload()
  }
}

const openSearch = () => { isSearchOpen.value = true }
const openFilter = () => { isFilterOpen.value = true }
const openNotifications = () => { isNotificationsOpen.value = true }
</script>

<template>
  <div class="relative w-full h-screen overflow-hidden">
    <!-- Animated Background -->
    <LiquidBackground />

    <div 
      class="fixed top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/80 to-transparent z-30 pointer-events-none blur-sm" 
      aria-hidden="true"
    ></div>

    <div 
      class="fixed bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black/80 to-transparent z-30 pointer-events-none blur-sm" 
      aria-hidden="true"
    ></div>

    <div class="relative z-10">
      <!-- Header -->
      <header v-if="showHeader" class="fixed top-0 left-0 right-0 z-50 px-3 header-safe-area">
        <div class="flex items-center justify-between gap-2 py-1">
          <!-- Title Bubble -->
          <div class="ios26-bubble h-14 px-5 shrink-0">
            <h1 class="text-white text-[17px] font-semibold tracking-tight whitespace-nowrap">{{ currentPageTitle }}</h1>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-1.5">
            <!-- Language Toggle Bubble (home only) -->
            <button 
              v-if="route.path === '/'"
              @click="toggleLocale"
              class="ios26-bubble ios26-bubble-interactive h-14 px-3 gap-1.5"
              aria-label="Changer de langue"
            >
              <span class="text-white text-sm font-semibold uppercase">{{ locale.toUpperCase() }}</span>
              <Icon name="fluent:globe-24-regular" class="w-4 h-4 text-white/80" />
            </button>

            <!-- Grouped Action Buttons Bubble -->
            <div class="ios26-bubble h-14 gap-0.5 px-1">
              <!-- Refresh (home only) -->
              <UiIconButton
                v-if="route.path === '/'"
                icon="fluent:arrow-clockwise-24-regular"
                label="Actualiser l'application"
                variant="bubble"
                @click="refreshApp"
              />

              <!-- PWA Install -->
              <Transition name="badge-pop">
                <UiIconButton
                  v-if="isInstallAvailable && !isStandalone"
                  icon="fluent:arrow-download-24-regular"
                  :label="t('pwa.installApp')"
                  variant="bubble"
                  class="text-cyan-400"
                  @click="showInstallPrompt(true)"
                />
              </Transition>

              <!-- Search -->
              <UiIconButton
                icon="fluent:search-24-regular"
                label="Recherche"
                variant="bubble"
                @click="openSearch"
              />

              <!-- Filters (schedule only) -->
              <UiIconButton
                v-if="route.path === '/schedule'"
                icon="fluent:options-24-regular"
                label="Filtres"
                variant="bubble"
                @click="openFilter"
              />

              <!-- Notifications -->
              <UiIconButton
                icon="fluent:alert-24-regular"
                label="Notifications"
                variant="bubble"
                @click="openNotifications"
              >
                <Transition name="badge-pop">
                  <span 
                    v-if="hasUnreadNotifications"
                    class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-red-500 rounded-full text-[10px] font-bold text-white shadow-lg shadow-red-500/30 animate-pulse"
                  >
                    {{ unreadCount > 99 ? '99+' : unreadCount }}
                  </span>
                </Transition>
              </UiIconButton>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content Area - Scrollable -->
      <main :class="[
        'h-screen overflow-y-auto',
        showHeader ? 'main-content' : 'pt-0',
        showFooter ? 'main-content-with-footer' : 'pb-0'
      ]">
        <slot />
      </main>

      <!-- Bottom Navigation Dock -->
      <nav v-show="showFooter" class="fixed bottom-0 left-0 right-0 z-50 px-3 nav-safe-area">
        <div class="flex items-center gap-2 py-1">
          <!-- Main Nav Bubble -->
          <div class="ios26-bubble h-16 nav-dock flex-1 justify-around px-2">
            <NuxtLink
              v-for="item in mainNavItems"
              :key="item.id"
              :to="item.to"
              class="nav-item relative flex items-center justify-center group transition-colors"
              :class="{ 'nav-item-center': item.isCenter }"
              :aria-label="t(item.labelKey)"
            >
              <div 
                class="nav-icon-wrap p-2 rounded-full transition-colors duration-200"
                :class="[
                  isActive(item.to) ? 'text-cyan-400' : 'text-white/90 group-hover:text-cyan-200',
                  isActive(item.to) && item.isCenter ? 'glow-cyan' : '',
                ]"
              >
                <span :class="[item.isCenter ? 'w-7 h-7' : 'w-6 h-6']" class="nav-icon-stack relative block">
                  <Icon
                    :name="item.icon"
                    class="nav-icon-layer absolute inset-0 w-full h-full"
                    :class="isActive(item.to) ? 'opacity-0' : 'opacity-100'"
                  />
                  <Icon
                    :name="item.iconFilled"
                    class="nav-icon-layer absolute inset-0 w-full h-full"
                    :class="isActive(item.to) ? 'opacity-100' : 'opacity-0'"
                  />
                </span>
              </div>
            </NuxtLink>
          </div>

          <!-- Separated Favorite Bubble -->
          <NuxtLink
            :to="separatedNavItem.to"
            class="ios26-bubble ios26-bubble-interactive h-16 nav-item-separated justify-center px-5 shrink-0"
            :aria-label="t(separatedNavItem.labelKey)"
          >
            <span class="w-6 h-6 nav-icon-stack relative block" :class="isActive(separatedNavItem.to) ? 'text-cyan-400' : 'text-white/90'">
              <Icon
                :name="separatedNavItem.icon"
                class="nav-icon-layer absolute inset-0 w-full h-full"
                :class="isActive(separatedNavItem.to) ? 'opacity-0' : 'opacity-100'"
              />
              <Icon
                :name="separatedNavItem.iconFilled"
                class="nav-icon-layer absolute inset-0 w-full h-full"
                :class="isActive(separatedNavItem.to) ? 'opacity-100' : 'opacity-0'"
              />
            </span>
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
      @close="closeGroupDetails"
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
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes badge-pop-out {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0); opacity: 0; }
}

.nav-dock {
  will-change: transform;
  transform: translateZ(0);
}

.nav-item {
  min-width: 52px;
  height: 100%;
}

.nav-item-center {
  min-width: 60px;
}

.nav-icon-wrap {
  transform: translateZ(0);
}

.nav-icon-stack {
  transform: translateZ(0);
}

.nav-icon-layer {
  transition: opacity 0.18s ease;
}

@media (prefers-reduced-motion: reduce) {
  .nav-icon-layer {
    transition: none;
  }
}
</style>