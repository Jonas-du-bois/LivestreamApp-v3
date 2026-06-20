<script setup lang="ts">
/**
 * UiGlassBadge
 * Composant atomique pour afficher un petit badge d'information avec un effet glassmorphism (bordure, fond semi-transparent et icône optionnelle).
 */

interface Props {
  icon?: string
  iconClass?: string
  bgClass?: string
  borderClass?: string
  paddingClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  icon: undefined,
  iconClass: 'w-4 h-4 text-white',
  bgClass: 'bg-white/10',
  borderClass: 'border-white/20',
  paddingClass: 'px-3 py-1.5'
})
</script>

<template>
  <span
    class="inline-flex items-center gap-2 rounded-full border transition-all"
    :class="[bgClass, borderClass, paddingClass]"
  >
    <Icon v-if="icon" :name="icon" :class="iconClass" aria-hidden="true" />
    <slot />
  </span>
</template>
