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

const { data: stream, pending, error } = await useFetch<PopulatedStream>(`/api/streams/${route.params.id}`)

if (error.value) {
  console.error('Error loading stream:', error.value)
}

// Computeds for safe access
const streamUrl = computed(() => stream.value?.url)
const isEmbed = computed(() => streamUrl.value?.includes('youtube') || streamUrl.value?.includes('vimeo'))
const currentGroup = computed(() => stream.value?.currentPassage?.group)
const currentApparatus = computed(() => stream.value?.currentPassage?.apparatus)
</script>

<template>
  <div class="pb-24 pt-20 px-4 min-h-screen relative z-10">
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
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>

          <div v-else class="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div class="w-20 h-20 rounded-full glass-panel flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icon name="fluent:play-24-filled" class="w-10 h-10 text-white ml-1" />
            </div>
            <a
              :href="streamUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-white font-bold hover:underline"
            >
              Ouvrir le lien externe
            </a>
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
        <GroupInfoCard :group="currentGroup" />
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
