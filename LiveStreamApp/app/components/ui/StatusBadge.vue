<script setup lang="ts">
/**
 * ⚛️ UiStatusBadge
 * Composant atomique pour afficher un badge de statut avec un indicateur visuel pulsant.
 */

interface Props {
  /** Variante de couleur (ex: 'green', 'red', 'violet', 'cyan') */
  variant?: 'green' | 'red' | 'violet' | 'cyan' | 'white'
  /** Active l'indicateur visuel (point) */
  showDot?: boolean
  /** Active l'animation de pulsation sur le point */
  pulse?: boolean
  /** Classes CSS additionnelles pour le conteneur */
  containerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'white',
  showDot: false,
  pulse: false,
  containerClass: ''
})

// Mappage des variantes vers les classes Tailwind
const variantClasses = computed(() => {
  const maps = {
    green: 'bg-green-500/20 border-green-500/30 text-green-400',
    red: 'bg-red-500/20 border-red-500/30 text-red-400',
    violet: 'bg-violet-500/20 border-violet-400/30 text-white',
    cyan: 'bg-cyan-500/20 border-cyan-400/30 text-cyan-400',
    white: 'bg-white/10 border-white/20 text-white'
  }
  return maps[props.variant] || maps.white
})

const dotClasses = computed(() => {
  const maps = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    violet: 'bg-violet-500',
    cyan: 'bg-cyan-400',
    white: 'bg-white'
  }
  return maps[props.variant] || maps.white
})
</script>

<template>
  <div 
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md shadow-lg transition-all"
    :class="[variantClasses, containerClass]"
  >
    <!-- Indicateur Visuel (Point) -->
    <span v-if="showDot" class="relative flex h-2 w-2 flex-shrink-0">
      <span 
        v-if="pulse"
        class="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
        :class="dotClasses"
      ></span>
      <span 
        class="relative inline-flex rounded-full h-2 w-2"
        :class="dotClasses"
      ></span>
    </span>

    <!-- Texte du badge -->
    <span class="text-xs font-bold tracking-widest uppercase leading-none">
      <slot />
    </span>
  </div>
</template>
