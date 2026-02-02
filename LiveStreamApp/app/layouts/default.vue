<script setup lang="ts">
interface NavItem {
  id: string
  icon: string
  iconFilled: string
  label: string
  to: string
  isCenter?: boolean
}

const route = useRoute()

const navItems: NavItem[] = [
  { id: 'home', icon: 'fluent:home-24-regular', iconFilled: 'fluent:home-24-filled', label: 'Accueil', to: '/' },
  { id: 'schedule', icon: 'fluent:calendar-24-regular', iconFilled: 'fluent:calendar-24-filled', label: 'Programme', to: '/schedule' },
  { id: 'stream', icon: 'fluent:play-circle-24-regular', iconFilled: 'fluent:play-circle-24-filled', label: 'Directs', to: '/stream', isCenter: true },
  { id: 'results', icon: 'fluent:trophy-24-regular', iconFilled: 'fluent:trophy-24-filled', label: 'Résultats', to: '/results' },
  { id: 'favorites', icon: 'fluent:heart-24-regular', iconFilled: 'fluent:heart-24-filled', label: 'Favoris', to: '/favorites' }
]

const pageTitles: Record<string, string> = {
  '/': 'Accueil',
  '/schedule': 'Programme',
  '/stream': 'Directs',
  '/results': 'Résultats',
  '/favorites': 'Mon Planning'
}

const currentPageTitle = computed(() => pageTitles[route.path] || 'Accueil')

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
const hasUnreadNotifications = ref(true)

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
                class="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
              >
                <Icon name="fluent:alert-24-regular" class="w-5 h-5 text-white" />
                <span 
                  v-if="hasUnreadNotifications"
                  class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" 
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content Area - Scrollable -->
      <main :class="[
        'h-screen overflow-y-auto',
        showHeader ? 'pt-28' : 'pt-0',
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
            :aria-label="item.label"
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
