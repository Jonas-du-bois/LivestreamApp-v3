<script setup lang="ts">
/**
 * ⚛️ PhotosGrid
 * Grille responsive de photos temps réel (Flickr).
 * 2 colonnes mobile → 3 tablette → 4 desktop.
 * Délègue chaque tuile à PhotosGridItem pour la gestion de chargement.
 */
import type { FlickrPhoto } from '~/types/flickr'
import PhotosGridItem from './PhotosGridItem.vue'

interface Props {
  photos: FlickrPhoto[]
  /** Set des IDs de nouvelles photos (pour le badge "New") */
  newPhotoIds?: Set<string>
}

const props = withDefaults(defineProps<Props>(), {
  newPhotoIds: () => new Set<string>()
})

const emit = defineEmits<{
  /** Émet l'index de la photo pour ouvrir le lightbox */
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
