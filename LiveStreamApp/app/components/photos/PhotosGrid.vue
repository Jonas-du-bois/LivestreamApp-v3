<script setup lang="ts">
/**
 * PhotosGrid
 * Grille responsive de photos affichées en temps réel.
 * La gestion du chargement de chaque image est déléguée au sous-composant PhotosGridItem.
 */
import type { FlickrPhoto } from '~/types/flickr'
import PhotosGridItem from './PhotosGridItem.vue'

interface Props {
  photos: FlickrPhoto[]
  newPhotoIds?: Set<string>
}

const props = withDefaults(defineProps<Props>(), {
  newPhotoIds: () => new Set<string>()
})

const emit = defineEmits<{
  openLightbox: [index: number]
}>()
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-6">
    <PhotosGridItem
      v-for="(photo, index) in photos"
      :key="photo.id"
      :photo="photo"
      :index="index"
      :is-new="props.newPhotoIds.has(photo.id)"
      @open="emit('openLightbox', $event)"
    />
  </div>
</template>
