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
  'glass-card transition-all duration-300 block outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120]',
  props.padding,
  isInteractive.value ? 'cursor-pointer hover:bg-white/15 hover:border-white/30 hover:shadow-lg hover:shadow-cyan-900/10 active:scale-[0.97] active:bg-white/20 active:border-cyan-400/50 active:shadow-cyan-500/20' : '',
  props.class
])

const handleKeyDown = (event: KeyboardEvent) => {
  if (props.to) return // Let NuxtLink handle it
  if (!isInteractive.value) return

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    // Trigger click on the element itself
    (event.currentTarget as HTMLElement).click()
  }
}
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'div'"
    :to="to"
    :class="cardClasses"
    :role="isInteractive ? 'button' : undefined"
    :tabindex="isInteractive ? 0 : undefined"
    @keydown="handleKeyDown"
  >
    <slot />
  </component>
</template>
