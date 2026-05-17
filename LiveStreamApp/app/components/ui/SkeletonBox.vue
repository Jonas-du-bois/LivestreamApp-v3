<script setup lang="ts">
/**
 * UiSkeletonBox
 * Un composant de squelette rectangulaire générique pour les zones de chargement
 * (Hero, cartes, listes, images).
 */

interface Props {
  glass?: boolean
  rounded?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  glass: true,
  rounded: true,
  class: ''
})

const boxClasses = computed(() => [
  props.glass ? 'glass-card opacity-50' : '',
  props.rounded ? 'rounded-xl' : '',
  'premium-skeleton-surface premium-skeleton-shimmer',
  props.class
])
</script>

<template>
  <div :class="boxClasses">
    <slot />
  </div>
</template>
