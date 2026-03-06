<script setup lang="ts">
/**
 * PhotosGridSkeleton
 * Squelette de chargement "shimmer" reproduisant la grille responsive de photos.
 */

interface Props {
  count?: number
}

withDefaults(defineProps<Props>(), { count: 12 })
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-6">
    <div
      v-for="i in count"
      :key="i"
      class="aspect-square rounded-xl premium-skeleton-surface premium-skeleton-shimmer"
      :style="{ '--cascade-index': i }"
    />
  </div>
</template>
