<script setup lang="ts">
import { PublicService } from '~/services/public.service'
import { useFavoritesStore } from '~/stores/favorites'
import { storeToRefs } from 'pinia'
import type { PassageEnriched } from '~/types/api'

const openGroupDetails = inject<(name: string) => void>('openGroupDetails')
const favoritesStore = useFavoritesStore()
const { favorites } = storeToRefs(favoritesStore)

// Fetch Schedule (we filter client-side for favorites for simplicity, or we could add an API endpoint)
// Since we have getSchedule, we can use it.
const { data: scheduleData } = await PublicService.getSchedule()

const favoritePassages = computed<PassageEnriched[]>(() => {
  if (!scheduleData.value?.data) return []
  return scheduleData.value.data
    .filter((p: any) => p.group?._id && favorites.value.includes(p.group._id))
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

// Separate upcoming and past events
const upcomingPassages = computed<PassageEnriched[]>(() => {
  const now = new Date()
  return favoritePassages.value.filter(p => new Date(p.startTime) > now)
})

const pastPassages = computed<PassageEnriched[]>(() => {
  const now = new Date()
  return favoritePassages.value
    .filter(p => new Date(p.startTime) <= now)
    .reverse() // Most recent first
})

// Next Event Countdown Logic
const nextEvent = computed(() => {
  const now = new Date()
  return favoritePassages.value.find(p => new Date(p.startTime) > now)
})

const timeToNext = ref('')

const updateTimer = () => {
  if (!nextEvent.value) {
    timeToNext.value = ''
    return
  }
  const now = new Date().getTime()
  const target = new Date(nextEvent.value.startTime).getTime()
  const diff = target - now

  if (diff <= 0) {
    timeToNext.value = 'En cours'
    return
  }

  const h = Math.floor(diff / (1000 * 60 * 60))
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  timeToNext.value = `${h}h ${m}m`
}

let timer: any = null
onMounted(() => {
  updateTimer()
  timer = setInterval(updateTimer, 60000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric' })
}

const toggleFavorite = (id: string, event: Event) => {
  event.stopPropagation()
  favoritesStore.toggleFavorite(id)
}

const handleGroupClick = (groupId: string) => {
  openGroupDetails?.(groupId)
}
</script>

<template>
  <div class="px-4 space-y-6 pb-6">
    <!-- Next Event Card -->
    <ClientOnly>
      <div v-if="nextEvent" class="glass-card p-6 relative overflow-hidden">
        <div class="absolute top-0 right-0 p-4 opacity-10">
          <Icon name="fluent:timer-24-filled" class="w-24 h-24" />
        </div>

        <p class="text-white/60 text-sm mb-2">Prochain passage favori</p>
        <div class="flex items-baseline gap-2 mb-4">
          <h2 class="text-4xl font-bold text-white">{{ timeToNext }}</h2>
        </div>

        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-cyan-400/20 flex items-center justify-center">
             <Icon v-if="nextEvent.apparatus?.icon" :name="nextEvent.apparatus.icon" class="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 class="text-white font-bold">{{ nextEvent.group?.name }}</h3>
            <p class="text-white/60 text-sm">{{ nextEvent.apparatus?.name }} • {{ nextEvent.location }}</p>
          </div>
        </div>
      </div>
    </ClientOnly>

    <!-- Upcoming Events List -->
    <ClientOnly>
      <div v-if="upcomingPassages.length > 0">
        <h3 class="text-white text-lg font-bold mb-4 px-1">Mon Programme</h3>
        <div class="space-y-3">
          <div
            v-for="passage in upcomingPassages"
            :key="passage._id"
            class="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-white/15 active:scale-[0.98] transition-all"
            @click="handleGroupClick(passage.group?._id || '')"
          >
            <div class="text-center min-w-[60px]">
               <div class="text-cyan-400 font-bold text-lg">{{ formatTime(passage.startTime) }}</div>
               <div class="text-white/40 text-xs uppercase">{{ formatDate(passage.startTime).split(' ')[0] }}</div>
            </div>

            <div class="flex-1 min-w-0">
              <h4 class="text-white font-bold mb-1">{{ passage.group?.name }}</h4>
              <div class="flex items-center gap-2 text-sm">
                 <span class="text-white/60">{{ passage.location }}</span>
                 <span class="text-white/40">•</span>
                 <span class="text-purple-400">{{ passage.apparatus?.name }}</span>
              </div>
            </div>

            <button
              @click="passage.group?._id && toggleFavorite(passage.group._id, $event)"
              class="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Icon name="fluent:heart-24-filled" class="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </ClientOnly>

    <!-- Past Events List -->
    <ClientOnly>
      <div v-if="pastPassages.length > 0">
        <h3 class="text-white text-lg font-bold mb-4 px-1">Événements passés</h3>
        <div class="space-y-3">
          <div
            v-for="passage in pastPassages"
            :key="passage._id"
            class="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-white/15 active:scale-[0.98] transition-all opacity-70"
            @click="handleGroupClick(passage.group?._id || '')"
          >
            <div class="text-center min-w-[60px]">
               <div class="text-cyan-400 font-bold text-lg">{{ formatTime(passage.startTime) }}</div>
               <div class="text-white/40 text-xs uppercase">{{ formatDate(passage.startTime).split(' ')[0] }}</div>
            </div>

            <div class="flex-1 min-w-0">
              <h4 class="text-white font-bold mb-1">{{ passage.group?.name }}</h4>
              <div class="flex items-center gap-2 text-sm">
                 <span class="text-white/60">{{ passage.location }}</span>
                 <span class="text-white/40">•</span>
                 <span class="text-purple-400">{{ passage.apparatus?.name }}</span>
              </div>
            </div>

            <button
              @click="passage.group?._id && toggleFavorite(passage.group._id, $event)"
              class="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Icon name="fluent:heart-24-filled" class="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </ClientOnly>

    <!-- Empty State -->
    <ClientOnly>
      <div v-if="favoritePassages.length === 0" class="glass-card p-8 text-center mt-10">
         <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Icon name="fluent:heart-broken-24-regular" class="w-8 h-8 text-white/40" />
         </div>
         <h3 class="text-white font-bold text-lg mb-2">Aucun favori pour le moment</h3>
         <p class="text-white/60 text-sm">
           Ajoutez des groupes en favoris depuis le programme pour créer votre planning personnalisé
         </p>
      </div>
    </ClientOnly>
  </div>
</template>