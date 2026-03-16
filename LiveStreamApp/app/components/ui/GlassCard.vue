<script setup lang="ts">
/**
 * UiGlassCard
 * Conteneur réutilisable appliquant l'effet de Glassmorphism du design system.
 * Se transforme automatiquement en bouton/lien interactif si des props spécifiques sont fournies.
 */

interface Props {
  to?: string | null
  interactive?: boolean
  padding?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  to: null,
  interactive: undefined,
  padding: 'p-4',
  class: ''
})

const isInteractive = computed(() => props.interactive ?? !!props.to)

// Compose dynamiquement les classes CSS : applique des effets de survol uniquement si le composant est interactif.
const cardClasses = computed(() => [
  'glass-card transition-all duration-200 block outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120]',
  props.padding,
  isInteractive.value ? 'cursor-pointer hover:bg-white/15 hover:border-white/30 hover:shadow-lg hover:shadow-cyan-900/10 active:scale-[0.98] active:bg-white/20 active:border-cyan-400/50 active:shadow-cyan-500/20' : '',
  props.class
])

// Permet l'activation au clavier pour l'accessibilité si la carte n'est pas un NuxtLink natif.
const handleKeyDown = (event: KeyboardEvent) => {
  if (props.to) return 
  if (!isInteractive.value) return

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
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
