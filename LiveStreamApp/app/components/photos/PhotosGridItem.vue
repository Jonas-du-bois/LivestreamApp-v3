<script setup lang="ts">
/**
 * PhotosGridItem
 * Composant de tuile individuelle pour la grille de photos.
 */
import type { FlickrPhoto } from '~/types/flickr'

interface Props {
  photo: FlickrPhoto
  index: number
  isNew?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isNew: false
})

const emit = defineEmits<{
  open: [index: number]
}>()

// Permet d'afficher un skeleton en arrière-plan pendant le téléchargement réseau de l'image.
const imgLoaded = ref(false)
const imgError = ref(false)

const handleLoad = () => { imgLoaded.value = true }
const handleError = () => {
  imgLoaded.value = true
  imgError.value = true
}

const { formatLocalizedTime } = useTranslatedData()

// Calcule dynamiquement l'heure locale pour l'overlay informatif affiché au survol.
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
    <div v-if="isNew" class="absolute top-2 left-2 z-30 pointer-events-none">
      <UiStatusBadge variant="cyan" :show-dot="true" :pulse="true">
        New
      </UiStatusBadge>
    </div>

    <div
      v-if="!imgLoaded"
      class="absolute inset-0 premium-skeleton-surface premium-skeleton-shimmer rounded-xl"
    />

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

    <div
      v-else
      class="absolute inset-0 flex items-center justify-center bg-gray-900/80"
    >
      <Icon name="fluent:image-off-24-regular" class="text-3xl text-white/20" />
    </div>

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
