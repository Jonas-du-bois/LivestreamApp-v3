<script setup lang="ts">
/**
 * ⚛️ UiInfoTile
 * Tuile d'information standardisée utilisant le Glassmorphism.
 * Utilisée pour afficher des statistiques, des horaires ou des infos clés.
 */

interface Props {
  icon: string
  label: string
  value?: string | number
  /** Couleur d'accentuation pour l'icône et sa bordure (ex: 'cyan', 'violet', 'orange') */
  accent?: 'cyan' | 'violet' | 'orange' | 'emerald' | 'pink' | 'white'
  /** Si fourni, transforme la tuile en lien NuxtLink */
  to?: string
  /** Taille de la tuile */
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  accent: 'cyan',
  size: 'md',
  value: ''
})

const accentClasses = computed(() => {
  const maps = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    pink: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    white: 'text-white bg-white/10 border-white/20'
  }
  return maps[props.accent] || maps.cyan
})

const iconBoxSize = computed(() => {
  if (props.size === 'sm') return 'h-10 w-10 rounded-lg'
  if (props.size === 'lg') return 'h-14 w-14 rounded-xl'
  return 'h-12 w-12 rounded-xl'
})

const iconSize = computed(() => {
  if (props.size === 'sm') return '20'
  if (props.size === 'lg') return '28'
  return '24'
})
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'div'"
    :to="to"
    class="glass-card p-4 flex items-center gap-4 transition-all"
    :class="[
      to ? 'hover:bg-white/15 active:scale-[0.98] cursor-pointer' : '',
      size === 'lg' ? 'p-5' : 'p-4'
    ]"
  >
    <!-- Icon Wrapper -->
    <div 
      class="flex items-center justify-center shrink-0 border shadow-lg"
      :class="[accentClasses, iconBoxSize]"
    >
      <Icon :name="icon" :size="iconSize" />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p 
        class="text-white/60 font-bold uppercase tracking-widest truncate"
        :class="size === 'lg' ? 'text-[11px] mb-0.5' : 'text-[10px]'"
      >
        {{ label }}
      </p>
      <p 
        v-if="value || $slots.default" 
        class="text-white font-bold leading-tight truncate"
        :class="size === 'lg' ? 'text-xl' : 'text-base'"
      >
        <slot>{{ value }}</slot>
      </p>
    </div>
  </component>
</template>
