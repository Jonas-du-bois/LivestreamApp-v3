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
  accent?: 'cyan' | 'violet' | 'orange' | 'emerald' | 'pink' | 'white' | 'blue'
  /** Si fourni, transforme la tuile en lien NuxtLink */
  to?: string
  /** Taille de la tuile */
  size?: 'sm' | 'md' | 'lg'
  /** Variante d'affichage : 'stat' (Label petit / Valeur grand) ou 'feature' (Titre grand / Description petit) */
  variant?: 'stat' | 'feature'
  /** Forme du conteneur d'icône */
  iconShape?: 'square' | 'circle'
}

const props = withDefaults(defineProps<Props>(), {
  accent: 'cyan',
  size: 'md',
  value: '',
  variant: 'stat',
  iconShape: 'square'
})

const accentClasses = computed(() => {
  const maps: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    pink: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    white: 'text-white bg-white/10 border-white/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  }
  return maps[props.accent] || maps.cyan
})

const iconBoxSize = computed(() => {
  const base = (() => {
    if (props.size === 'sm') return 'h-10 w-10'
    if (props.size === 'lg') return 'h-14 w-14'
    return 'h-12 w-12'
  })()

  const shape = props.iconShape === 'circle' ? 'rounded-full' : (props.size === 'sm' ? 'rounded-lg' : 'rounded-xl')

  return `${base} ${shape}`
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
      <template v-if="variant === 'feature'">
        <h3 class="text-white font-bold text-sm truncate">{{ label }}</h3>
        <p class="text-white/70 text-xs truncate mt-0.5">
          <slot>{{ value }}</slot>
        </p>
      </template>

      <template v-else>
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
      </template>
    </div>
  </component>
</template>
