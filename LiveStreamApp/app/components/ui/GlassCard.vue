<script setup lang="ts">
/**
 * ⚛️ UiGlassCard
 * Conteneur standardisé utilisant le Glassmorphism.
 * Gère automatiquement les états de survol et de clic interactifs.
 */

interface Props {
  /** Chemin NuxtLink. Si présent, la carte devient un lien. */
  to?: string | null
  /** Active les effets de survol et de clic (auto si 'to' est présent) */
  interactive?: boolean
  /** Padding interne (défaut: 'p-4') */
  padding?: string
  /** Classes CSS additionnelles */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  to: null,
  interactive: undefined,
  padding: 'p-4',
  class: ''
})

const isInteractive = computed(() => props.interactive ?? !!props.to)

const cardClasses = computed(() => [
  'glass-card transition-all duration-200 block outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120]',
  props.padding,
  isInteractive.value ? 'cursor-pointer hover:bg-white/15 active:scale-[0.98]' : '',
  props.class
])
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'div'"
    :to="to"
    :class="cardClasses"
    :role="isInteractive ? 'button' : undefined"
    :tabindex="isInteractive ? 0 : undefined"
  >
    <slot />
  </component>
</template>
