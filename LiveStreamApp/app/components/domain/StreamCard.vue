<script setup lang="ts">
import { computed, resolveComponent } from '#imports'
import { useI18n } from 'vue-i18n'
import { useTranslatedData } from '~/composables/useTranslatedData'

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
</script>

<template>
  <component
    :is="isLive ? resolveComponent('NuxtLink') : 'div'"
    :to="isLive ? `/stream/${stream.id}` : undefined"
    class="glass-card overflow-hidden block transition-colors"
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

        <div class="glass-card px-3 py-1.5">
          <span class="text-xs font-medium" :class="isLive ? 'text-white' : 'text-white/50'">{{ stream.salle }}</span>
        </div>
      </div>

      <!-- Play Overlay -->
      <div v-if="isLive" class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
        <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Icon name="fluent:play-24-filled" class="w-8 h-8 text-white" />
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <h3 class="font-bold mb-1" :class="isLive ? 'text-white' : 'text-white/50'">{{ stream.title }}</h3>

      <p v-if="isLive" class="text-white/60 text-sm">
        {{ t('stream.onTrack') }}: <span class="text-cyan-400">{{ stream.currentGroup }}</span>
        <template v-if="stream.currentApparatusCode">
          <span class="text-white/40"> • </span>
          <span class="text-purple-400">{{ translateApparatus(stream.currentApparatusCode, stream.currentApparatus) }}</span>
        </template>
      </p>

      <p v-else class="text-white/30 text-sm">{{ t('stream.streamUnavailable') }}</p>
    </div>
  </component>
</template>
