<script setup lang="ts">
import { computed, resolveComponent } from '#imports'
import { useI18n } from 'vue-i18n'
import { useTranslatedData } from '~/composables/useTranslatedData'

const NuxtLinkComp = resolveComponent('NuxtLink')

const { t } = useI18n()
const { translateApparatus } = useTranslatedData()

const props = defineProps<{
  stream: {
    id: string
    title: string
    thumbnail?: string
    salle?: string
    currentGroup?: string
    currentApparatus?: string
    currentApparatusCode?: string
  }
  isLive?: boolean
}>()

const isLive = computed(() => props.isLive ?? false)

/** Règle 3 — Titre non-dupliqué : affiche l'épreuve au lieu du lieu (déjà dans le badge) */
const displayTitle = computed(() => {
  if (props.stream.currentApparatusCode) {
    return translateApparatus(props.stream.currentApparatusCode, props.stream.currentApparatus)
  }
  return 'Flux vidéo en direct'
})

/** Règle 4 — Détection d'un groupe « réellement » en piste */
const hasCurrentGroup = computed(() => {
  return !!props.stream.currentGroup && props.stream.currentGroup.trim() !== ''
})
</script>

<template>
  <component
    :is="isLive ? NuxtLinkComp : 'div'"
    :to="isLive ? `/stream/${stream.id}` : undefined"
    class="glass-card overflow-hidden block transition-colors group"
    :class="{ 'cursor-pointer hover:border-cyan-400/50': isLive, 'cursor-not-allowed opacity-60': !isLive }"
  >
    <div class="relative aspect-video">
      <ImageWithFallback
        :src="stream.thumbnail"
        :alt="stream.title"
        class="w-full h-full object-cover"
        :class="{ 'grayscale': !isLive }"
      />

      <!-- Offline Overlay -->
      <div v-if="!isLive" class="absolute inset-0 bg-black/50 flex items-center justify-center">
        <div class="text-center">
          <Icon name="fluent:video-off-24-regular" class="w-10 h-10 text-white/50 mx-auto mb-2" />
          <span class="text-white/50 text-sm font-medium">{{ t('stream.offline') }}</span>
        </div>
      </div>

      <!-- Badges -->
      <div class="absolute top-3 left-3 flex gap-2">
        <UiStatusBadge v-if="isLive" variant="solid-red" show-dot pulse>
          {{ t('stream.live') }}
        </UiStatusBadge>

        <!-- Règle 2 — Glassmorphism sombre pour lisibilité sur tout fond -->
        <div class="bg-black/60 backdrop-blur-md px-4 py-1 rounded-2xl items-center justify-center">
          <span class="text-xs font-bold text-white">{{ stream.salle }}</span>
        </div>
      </div>

      <!-- Règle 1 — Bouton Play central toujours visible (affordance) -->
      <div v-if="isLive" class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          class="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
        >
          <Icon name="fluent:play-24-filled" class="w-7 h-7 text-white ml-0.5" />
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Règle 3 — Titre = épreuve (le lieu est déjà dans le badge) -->
      <h3
        class="text-lg font-extrabold mt-3"
        :class="isLive ? 'text-white' : 'text-white/50'"
      >
        {{ displayTitle }}
      </h3>

      <!-- Règle 4 — Empty state « En piste » -->
      <template v-if="isLive">
        <p v-if="hasCurrentGroup" class="text-sm mt-1">
          <span class="text-white/60">{{ t('stream.onTrack') }} : </span>
          <span class="text-white font-medium">{{ stream.currentGroup }}</span>
          <template v-if="stream.currentApparatusCode">
            <span class="text-white/40"> • </span>
            <span class="text-purple-400">{{ translateApparatus(stream.currentApparatusCode, stream.currentApparatus) }}</span>
          </template>
        </p>
        <p v-else class="mt-1">
          <span class="italic text-white/50 text-sm">En attente du prochain passage...</span>
        </p>
      </template>

      <p v-else class="text-white/30 text-sm">{{ t('stream.streamUnavailable') }}</p>
    </div>
  </component>
</template>
