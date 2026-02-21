<script setup lang="ts">
/**
 * ⚛️ UiSectionTitle
 * Titre de section standardisé.
 * Centralise la typographie (bold, white) et le padding horizontal léger (px-1).
 */

interface Props {
  /** Niveau de titre HTML (h1-h6) */
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  /** Taille du texte (base, lg, xl, 2xl) */
  size?: 'base' | 'lg' | 'xl' | '2xl'
  /** Classes CSS additionnelles */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'h3',
  size: 'lg',
  class: ''
})

const sizeClasses = {
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl'
}
</script>

<template>
  <component
    :is="tag"
    class="text-white font-bold px-1"
    :class="[sizeClasses[size], props.class]"
  >
    <slot />
  </component>
</template>
