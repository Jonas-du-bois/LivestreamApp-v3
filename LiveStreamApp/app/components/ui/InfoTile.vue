<script setup lang="ts">
/**
 * UiInfoTile
 * Tuile d'information standardisée utilisant le Glassmorphism.
 * Utilisée pour afficher des statistiques, des horaires ou des infos clés.
 */

interface Props {
  icon: string
  label: string
  value?: string | number
  accent?: 'cyan' | 'violet' | 'orange' | 'emerald' | 'pink' | 'white' | 'blue'
  to?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'stat' | 'feature'
  iconShape?: 'square' | 'circle'
}

const props = withDefaults(defineProps<Props>(), {
  accent: 'emerald',
  size: 'md',
  value: '',
  variant: 'stat',
  iconShape: 'square'
})

// Adapte la taille de la boîte de l'icône en fonction de la taille globale demandée pour la tuile.
const boxSize = computed(() => {
  if (props.size === 'sm') return 'md'
  if (props.size === 'lg') return 'xl'
  return 'lg'
})

const boxShape = computed(() => {
  return props.iconShape === 'circle' ? 'circle' : 'rounded'
})

const NuxtLink = resolveComponent('NuxtLink')

const accentStyle = computed(() => {
  const palette = {
    cyan: { color: 'var(--color-primary)', rgb: 'var(--color-primary-rgb)' },
    blue: { color: 'var(--color-primary)', rgb: 'var(--color-primary-rgb)' },
    violet: { color: 'var(--color-secondary)', rgb: 'var(--color-secondary-rgb)' },
    emerald: { color: 'var(--color-tertiary)', rgb: 'var(--color-tertiary-rgb)' },
    orange: { color: '#fb923c', rgb: '251 146 60' },
    pink: { color: '#f472b6', rgb: '244 114 182' },
    white: { color: '#ffffff', rgb: '255 255 255' }
  } as const

  return {
    '--tile-accent': palette[props.accent].color,
    '--tile-accent-rgb': palette[props.accent].rgb
  }
})
</script>

<template>
  <component
    :is="to ? NuxtLink : 'div'"
    :to="to"
    class="glass-card ui-info-tile relative isolate overflow-hidden p-4 flex items-center gap-4 transition-all"
    :class="[
      to ? 'ui-info-tile--interactive app-focus-ring hover:bg-white/15 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120] outline-none' : '',
      size === 'lg' ? 'p-5' : 'p-4'
    ]"
    :style="accentStyle"
  >
    <UiIconBox
      :icon="icon"
      :size="boxSize"
      :shape="boxShape"
      :color="accent"
      variant="glass"
      :glow="false"
      class="relative z-10"
    />

    <div class="relative z-10 flex-1 min-w-0">
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

<style scoped>
.ui-info-tile {
  border-color: rgb(var(--tile-accent-rgb) / 0.14);
  background:
    radial-gradient(circle at top right, rgb(var(--tile-accent-rgb) / 0.16), transparent 38%),
    linear-gradient(160deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.05) 52%, rgba(11, 17, 32, 0.2) 100%);
}

.ui-info-tile::after {
  content: '';
  position: absolute;
  inset: auto -15% -55% 35%;
  height: 130px;
  border-radius: 9999px;
  pointer-events: none;
  background: radial-gradient(circle, rgb(var(--tile-accent-rgb) / 0.24), transparent 70%);
  opacity: 0.55;
}

.ui-info-tile--interactive:hover {
  border-color: rgb(var(--tile-accent-rgb) / 0.3);
  box-shadow:
    0 18px 30px rgb(var(--tile-accent-rgb) / 0.14),
    0 0 0 1px rgb(var(--tile-accent-rgb) / 0.08);
}

.ui-info-tile--interactive:active {
  border-color: rgb(var(--tile-accent-rgb) / 0.42);
}
</style>
