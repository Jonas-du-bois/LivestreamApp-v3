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
  'glass-card ui-glass-card app-focus-ring transition-all duration-200 block',
  props.padding,
  isInteractive.value ? 'ui-glass-card--interactive cursor-pointer active:scale-[0.98] active:border-white/30 active:bg-white/5' : '',
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

<style scoped>
.ui-glass-card {
  position: relative;
  isolation: isolate;
}

.ui-glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(140deg, transparent 0%, rgb(var(--color-primary-rgb) / 0.08) 45%, transparent 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.ui-glass-card--interactive:hover {
  border-color: rgb(var(--color-secondary-rgb) / 0.28);
  box-shadow:
    0 20px 36px rgba(2, 6, 23, 0.24),
    0 0 0 1px rgb(var(--color-secondary-rgb) / 0.1);
}

.ui-glass-card--interactive:hover::before {
  opacity: 1;
}

.ui-glass-card--interactive:active {
  border-color: rgb(var(--color-tertiary-rgb) / 0.36);
  box-shadow:
    0 16px 30px rgba(2, 6, 23, 0.2),
    0 0 0 1px rgb(var(--color-tertiary-rgb) / 0.12);
}
</style>
