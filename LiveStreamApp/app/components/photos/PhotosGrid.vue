<script setup lang="ts">
/**
 * PhotosGrid
 * Grille responsive de photos avec pagination infinie côté client.
 * - Affiche les 20 premières photos, charge la suite au scroll via IntersectionObserver.
 * - Les index émis vers la lightbox correspondent toujours au tableau complet (slice depuis 0).
 */
import type { FlickrPhoto } from '~/types/flickr'
import PhotosGridItem from './PhotosGridItem.vue'
import PhotosGridSkeleton from './PhotosGridSkeleton.vue'

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

const photosRef = computed(() => props.photos)
const { visibleItems: visiblePhotos, hasMore, loadMore } = usePhotoPagination(photosRef)

// ─── Sentinel IntersectionObserver ───────────────────────────────────────────
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!sentinel.value) return
  observer = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) loadMore() },
    { rootMargin: '300px' }
  )
  observer.observe(sentinel.value)
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-6">
      <PhotosGridItem
        v-for="(photo, index) in visiblePhotos"
        :key="photo.id"
        :photo="photo"
        :index="index"
        :is-new="props.newPhotoIds.has(photo.id)"
        :style="{ '--cascade-index': Math.min(index, 7) }"
        @open="emit('openLightbox', $event)"
      />
    </div>

    <!-- Sentinel : déclenche le chargement de la page suivante au scroll -->
    <div ref="sentinel" class="px-6 mt-3">
      <PhotosGridSkeleton v-if="hasMore" :count="4" />
    </div>
  </div>
</template>
