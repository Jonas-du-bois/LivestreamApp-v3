<script setup lang="ts">
/**
 * ⚛️ PhotosGridSkeleton
 * Grille squelette pour l'état de chargement des photos Flickr.
 * Simule le layout 2 colonnes mobile / 3 colonnes tablet / 4 colonnes desktop.
 */

interface Props {
  /** Nombre de tuiles simulées (défaut : 12) */
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
