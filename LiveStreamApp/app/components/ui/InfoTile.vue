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
  accent: 'cyan',
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
</script>

<template>
  <component
    :is="to ? NuxtLink : 'div'"
    :to="to"
    class="glass-card p-4 flex items-center gap-4 transition-all"
    :class="[
      to ? 'hover:bg-white/15 active:scale-[0.98] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120]' : '',
      size === 'lg' ? 'p-5' : 'p-4'
    ]"
  >
    <UiIconBox
      :icon="icon"
      :size="boxSize"
      :shape="boxShape"
      :color="accent"
      variant="glass"
      :glow="false"
    />

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
