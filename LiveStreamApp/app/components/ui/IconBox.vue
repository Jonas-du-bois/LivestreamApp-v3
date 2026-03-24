<script setup lang="ts">
/**
 * UiIconBox
 * Conteneur atomique standardisé pour afficher une icône avec style.
 * Supporte différents styles (verre, solide, dégradé), formes, tailles et couleurs.
 * Remplace les blocs <div> répétés pour les icônes dans l'application.
 */

interface Props {
  icon: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  shape?: 'circle' | 'rounded' | 'square'
  variant?: 'solid' | 'glass' | 'outline' | 'gradient' | 'ghost'
  color?: 'cyan' | 'violet' | 'blue' | 'white' | 'gray' | 'orange' | 'red' | 'green' | 'emerald' | 'pink' | 'amber'
  pulse?: boolean
  glow?: boolean
  interactive?: boolean
  to?: string
  as?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  shape: 'rounded',
  variant: 'solid',
  color: 'cyan',
  pulse: false,
  glow: false,
  interactive: false,
  to: undefined,
  as: undefined
})

const NuxtLink = resolveComponent('NuxtLink')

// Détermine dynamiquement la taille de la boîte et de l'icône
const sizeClasses = computed(() => {
  const sizes = {
    xs: { box: 'w-6 h-6', icon: '12' },
    sm: { box: 'w-8 h-8', icon: '16' },
    md: { box: 'w-10 h-10', icon: '20' },
    lg: { box: 'w-12 h-12', icon: '24' },
    xl: { box: 'w-14 h-14', icon: '28' }
  }
  return sizes[props.size] || sizes.md
})

const shapeClasses = computed(() => {
  if (props.shape === 'circle') return 'rounded-full'
  if (props.shape === 'square') return 'rounded-none'
  if (props.size === 'xs' || props.size === 'sm') return 'rounded-md'
  return 'rounded-xl'
})

// Logique complexe de mapping de couleurs pour gérer toutes les variantes du design system.
const colorClasses = computed(() => {
  const colors = {
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500', border: 'border-cyan-500' },
    violet: { text: 'text-violet-400', bg: 'bg-violet-500', border: 'border-violet-500' },
    blue: { text: 'text-cyan-400', bg: 'bg-cyan-500', border: 'border-cyan-500' },
    white: { text: 'text-white', bg: 'bg-white', border: 'border-white' },
    gray: { text: 'text-gray-400', bg: 'bg-gray-600', border: 'border-gray-500' },
    orange: { text: 'text-orange-400', bg: 'bg-orange-500', border: 'border-orange-500' },
    red: { text: 'text-red-400', bg: 'bg-red-500', border: 'border-red-500' },
    green: { text: 'text-green-400', bg: 'bg-green-500', border: 'border-green-500' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500' },
    pink: { text: 'text-pink-400', bg: 'bg-pink-500', border: 'border-pink-500' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500' }
  }

  const c = colors[props.color] || colors.blue

  switch (props.variant) {
    case 'solid':
      return `${c.bg}/90 text-white backdrop-blur shadow-lg border border-white/5`

    case 'glass':
      return `${c.bg}/10 ${c.text} ${c.border}/20 border backdrop-blur-md`

    case 'outline':
      return `bg-transparent border ${c.border} ${c.text}`

    case 'ghost':
      return `bg-transparent hover:bg-white/10 ${c.text}`

    case 'gradient':
      if (props.color === 'violet') return `bg-gradient-to-br from-violet-500 to-cyan-500 text-white border border-white/10`
      if (props.color === 'cyan' || props.color === 'blue') return `bg-gradient-to-br from-cyan-400 to-violet-500 text-white border border-white/10`
      if (props.color === 'emerald') return `bg-gradient-to-br from-emerald-400 to-cyan-500 text-white border border-white/10`
      if (props.color === 'orange') return `bg-gradient-to-br from-orange-400 to-red-600 text-white border border-white/10`
      if (props.color === 'amber') return `bg-gradient-to-br from-amber-400 to-orange-600 text-white border border-white/10`
      return `${c.bg} text-white`

    default:
      return `${c.bg}/10 ${c.text} border-white/10`
  }
})

// Détermine l'ombre portée (glow) à appliquer en fonction de la couleur.
const glowClasses = computed(() => {
  if (!props.glow) return ''

  const glows = {
    cyan: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    violet: 'shadow-[0_0_30px_rgba(139,92,246,0.6)]',
    blue: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    orange: 'shadow-[0_0_20px_rgba(249,115,22,0.4)]',
    white: 'shadow-[0_0_20px_rgba(255,255,255,0.2)]',
    red: 'shadow-lg shadow-red-500/30',
    green: 'shadow-lg shadow-green-500/30',
    emerald: 'shadow-lg shadow-emerald-500/30',
    pink: 'shadow-lg shadow-pink-500/30',
    amber: 'shadow-lg shadow-amber-500/30',
    gray: 'shadow-lg'
  }
  return glows[props.color] || 'shadow-lg'
})

const interactiveClasses = computed(() => {
  if (!props.interactive && !props.to && props.as !== 'button') return ''
  return 'app-focus-ring cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200'
})

const finalComponent = computed(() => {
  if (props.to) return NuxtLink
  if (props.as) return props.as
  return 'div'
})
</script>

<template>
  <component
    :is="finalComponent"
    :to="to"
    class="flex items-center justify-center shrink-0 relative overflow-hidden"
    :class="[
      sizeClasses.box,
      shapeClasses,
      colorClasses,
      glowClasses,
      interactiveClasses,
      pulse ? 'animate-pulse-slow' : ''
    ]"
  >
    <div v-if="variant === 'gradient'" class="absolute inset-0 bg-white/10 mix-blend-overlay pointer-events-none" />

    <Icon
      :name="icon"
      :size="sizeClasses.icon"
      class="relative z-10"
    />
  </component>
</template>

<style scoped>
@keyframes pulse-slow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.05); }
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}
</style>
