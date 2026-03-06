<script setup lang="ts">
/**
 * UiSkeletonCard
 * Une carte squelette générique destinée à être utilisée avec CascadeSkeletonList.
 * Réduit la duplication de code entre les pages Programme, Favoris et Résultats.
 */

interface Props {
  layout?: 'time' | 'avatar'
  content?: 'text' | 'pills'
  action?: 'circle' | 'box'
  align?: 'start' | 'center'
}

withDefaults(defineProps<Props>(), {
  layout: 'time',
  content: 'text',
  action: 'circle',
  align: 'center'
})
</script>

<template>
  <div class="p-4 flex gap-4" :class="align === 'start' ? 'items-start' : 'items-center'">
    <div v-if="layout === 'avatar'" class="w-12 h-12 rounded-full premium-skeleton-surface premium-skeleton-shimmer flex-shrink-0"></div>
    <div v-else class="text-left min-w-[60px] flex-shrink-0 space-y-2">
      <div class="premium-skeleton-line premium-skeleton-shimmer h-6 w-14"></div>
      <div class="premium-skeleton-line premium-skeleton-shimmer h-3 w-12"></div>
    </div>

    <div class="flex-1 min-w-0 space-y-2" :class="align === 'start' ? 'pt-0.5' : ''">
      <div class="premium-skeleton-line premium-skeleton-shimmer h-5 w-2/3"></div>
      
      <div v-if="content === 'pills'" class="flex items-center gap-2">
        <div class="premium-skeleton-pill premium-skeleton-shimmer w-20"></div>
        <div class="premium-skeleton-pill premium-skeleton-shimmer w-28"></div>
      </div>
      
      <div v-else class="premium-skeleton-line premium-skeleton-shimmer h-4 w-1/2"></div>
    </div>

    <div v-if="action === 'box'" class="premium-skeleton-line premium-skeleton-shimmer h-8 w-16 rounded-lg flex-shrink-0"></div>
    <div v-else class="w-8 h-8 rounded-full premium-skeleton-surface premium-skeleton-shimmer flex-shrink-0"></div>
  </div>
</template>
