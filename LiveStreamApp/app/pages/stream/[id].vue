<script setup lang="ts">
import type { Stream, Passage, Group, Apparatus } from '../../types/api'

const route = useRoute()
const router = useRouter() // Use router for back navigation if needed, or simple link

// Define populated types for this view
interface PopulatedPassage extends Omit<Passage, 'group' | 'apparatus'> {
  group: Group;
  apparatus: Apparatus;
}

interface PopulatedStream extends Omit<Stream, 'currentPassage'> {
  currentPassage?: PopulatedPassage;
}

const { data: stream, pending, error } = await useFetch<PopulatedStream>(() => `/api/streams/${route.params.id}`)

if (error.value) {
  console.error('Error loading stream:', error.value)
}

// Computeds for safe access
import { ref, watch, onBeforeUnmount, onMounted } from 'vue'
import { useSocket } from '../../composables/useSocket'

const streamUrl = computed(() => stream.value?.url)
const isEmbed = computed(() => streamUrl.value?.includes('youtube') || streamUrl.value?.includes('vimeo'))
const currentGroup = computed(() => stream.value?.currentPassage?.group)
const currentApparatus = computed(() => stream.value?.currentPassage?.apparatus)

const openGroupDetails = inject<(groupId: string) => void>('openGroupDetails')

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

onBeforeUnmount(() => {
  if (playerTimeout) clearTimeout(playerTimeout)
  const socket = useSocket()
  if (socket) {
    socket.off('stream-update')
  }
})

onMounted(() => {
  const socket = useSocket()
  if (socket) {
    socket.emit('join-room', `stream-${route.params.id}`)
    socket.on('stream-update', (updatedStream: Partial<Stream>) => {
      if (stream.value && updatedStream._id === stream.value._id) {
        if (updatedStream.url !== undefined) stream.value.url = updatedStream.url
        if (updatedStream.isLive !== undefined) stream.value.isLive = updatedStream.isLive
        // If other fields need updating, add them here.
        // Note: currentPassage might be an ID in the update, but we have a populated object.
        // We avoid overwriting the populated object unless we re-fetch.
      }
    })
  }
})
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
      <h1 class="text-xl font-bold text-white">Retour aux directs</h1>
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
            <p class="text-white mb-3">Le lecteur intégré n'a pas pu se charger (une extension peut bloquer les requêtes). Ouvrir le flux en externe :</p>
            <a
              :href="streamUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-block bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg"
            >
              Ouvrir le flux
            </a>
          </div>

          <div v-else-if="!isEmbed || !streamUrl" class="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div class="w-20 h-20 rounded-full glass-panel flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icon name="fluent:play-24-filled" class="w-10 h-10 text-white ml-1" />
            </div>
            <a
              v-if="streamUrl"
              :href="streamUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-white font-bold hover:underline"
            >
              Ouvrir le lien externe
            </a>
            <p v-else class="text-white/60">Aucun lien disponible pour ce flux.</p>
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
            <p class="text-red-400 text-xs font-bold uppercase tracking-wider">En Direct</p>
          </div>
        </div>

        <div v-if="currentApparatus" class="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
          <Icon :name="currentApparatus.icon || 'fluent:sport-24-regular'" class="w-5 h-5 text-cyan-400" />
          <span class="text-white font-medium text-sm">{{ currentApparatus.name }}</span>
        </div>
      </div>

      <!-- Context Section -->
      <div v-if="currentGroup">
        <h3 class="text-white/60 font-medium mb-3 ml-1">Sur le praticable :</h3>
        <div @click="openGroupDetails && currentGroup._id && openGroupDetails(currentGroup._id)" class="cursor-pointer active:scale-[0.98] transition-transform">
           <GroupInfoCard :group="currentGroup" />
        </div>
      </div>

      <div v-else class="glass-panel p-6 text-center">
        <p class="text-white/60">Aucun passage en cours pour le moment.</p>
      </div>
    </div>

    <div v-else class="glass-panel p-8 text-center">
      <h2 class="text-white font-bold text-xl mb-2">Stream introuvable</h2>
      <NuxtLink to="/stream" class="text-cyan-400 hover:underline">Retourner à la liste</NuxtLink>
    </div>
  </div>
</template>
