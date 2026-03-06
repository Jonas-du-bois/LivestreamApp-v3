<script setup lang="ts">
/**
 * ⚛️ PhotosGridItem
 * Tuile de photo individuelle pour la grille temps réel.
 * - Chargement lazy via loading="lazy" + IntersectionObserver interne
 * - Indicateur visuel pour les nouvelles photos
 * - Animation d'entrée en cascade (premium-cascade-item)
 */
import type { FlickrPhoto } from '~/types/flickr'

interface Props {
  photo: FlickrPhoto
  index: number
  /** Marque la photo comme nouvellement arrivée (badge + anneau cyan) */
  isNew?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isNew: false
})

const emit = defineEmits<{
  /** Émet l'index de la photo pour ouvrir le lightbox */
  open: [index: number]
}>()

// ─── État de chargement de l'image ─────────────────────────────────────────
const imgLoaded = ref(false)
const imgError = ref(false)

const handleLoad = () => { imgLoaded.value = true }
const handleError = () => {
  imgLoaded.value = true // cacher le skeleton
  imgError.value = true
}

// ─── Formatage de l'heure pour l'overlay hover ─────────────────────────────
const { formatLocalizedTime } = useTranslatedData()

const formattedTime = computed(() => {
  return formatLocalizedTime(props.photo.dateUpload * 1000)
})
</script>

<template>
  <button
    type="button"
    class="relative w-full aspect-square overflow-hidden rounded-xl group outline-none
           focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2
           focus-visible:ring-offset-[#0B1120] transition-transform duration-150
           active:scale-[0.94] premium-cascade-item"
    :class="isNew ? 'ring-2 ring-cyan-400/70 ring-offset-[2px] ring-offset-[#0B1120]' : 'glass-card'"
    :style="{ '--cascade-index': index }"
    :aria-label="photo.title || `Photo ${index + 1}`"
    @click="emit('open', index)"
  >
    <!-- Badge "Nouveau" -->
    <div v-if="isNew" class="absolute top-2 left-2 z-30 pointer-events-none">
      <UiStatusBadge variant="cyan" :show-dot="true" :pulse="true">
        New
      </UiStatusBadge>
    </div>

    <!-- Skeleton shimmer pendant le chargement -->
    <div
      v-if="!imgLoaded"
      class="absolute inset-0 premium-skeleton-surface premium-skeleton-shimmer rounded-xl"
    />

    <!-- Image principale -->
    <img
      v-if="!imgError"
      :src="photo.urls.z"
      :alt="photo.title || `Photo ${index + 1}`"
      loading="lazy"
      decoding="async"
      class="absolute inset-0 w-full h-full object-cover transition-transform duration-500
             group-hover:scale-105"
      :class="imgLoaded ? 'opacity-100' : 'opacity-0'"
      @load="handleLoad"
      @error="handleError"
    />

    <!-- État d'erreur -->
    <div
      v-else
      class="absolute inset-0 flex items-center justify-center bg-gray-900/80"
    >
      <Icon name="fluent:image-off-24-regular" class="text-3xl text-white/20" />
    </div>

    <!-- Overlay hover avec infos (toujours visible sur mobile, hover sur desktop) -->
    <div
      v-if="!imgError"
      class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent
             flex flex-col justify-end p-2.5 pointer-events-none
             opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300"
    >
      <p
        v-if="photo.title"
        class="text-white text-[11px] font-semibold truncate leading-tight drop-shadow"
      >
        {{ photo.title }}
      </p>
      <p class="text-white/60 text-[10px] mt-0.5 drop-shadow">{{ formattedTime }}</p>
    </div>
  </button>
</template>
