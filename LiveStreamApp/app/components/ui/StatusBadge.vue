<script setup lang="ts">
/**
 * UiStatusBadge
 * Composant atomique pour afficher un badge de statut avec un indicateur visuel pulsant.
 */

interface Props {
  variant?: 'green' | 'emerald' | 'red' | 'violet' | 'cyan' | 'white' | 'solid-red'
  showDot?: boolean
  pulse?: boolean
  containerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'white',
  showDot: false,
  pulse: false,
  containerClass: ''
})

// Mappage des couleurs du conteneur et du texte
const variantClasses = computed(() => {
  const maps = {
    green: 'bg-emerald-500/18 border-emerald-400/30 text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.14)]',
    emerald: 'bg-emerald-500/18 border-emerald-400/30 text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.14)]',
    red: 'bg-red-500/20 border-red-500/30 text-red-400',
    violet: 'bg-violet-500/18 border-violet-400/30 text-violet-100 shadow-[0_0_18px_rgba(139,92,246,0.14)]',
    cyan: 'bg-cyan-500/18 border-cyan-400/30 text-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.14)]',
    white: 'bg-white/10 border-white/20 text-white',
    'solid-red': 'bg-red-500/90 border-red-400/50 text-white shadow-red-900/20'
  }
  return maps[props.variant] || maps.white
})

// Mappage des couleurs du point indicateur
const dotClasses = computed(() => {
  const maps = {
    green: 'bg-emerald-400',
    emerald: 'bg-emerald-400',
    red: 'bg-red-500',
    violet: 'bg-violet-500',
    cyan: 'bg-cyan-400',
    white: 'bg-white',
    'solid-red': 'bg-white'
  }
  return maps[props.variant] || maps.white
})
</script>

<template>
  <div 
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md shadow-lg transition-all"
    :class="[variantClasses, containerClass]"
  >
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

    <span class="text-xs font-bold tracking-widest uppercase leading-none">
      <slot />
    </span>
  </div>
</template>
