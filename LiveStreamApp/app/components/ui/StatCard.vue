<script setup lang="ts">
/**
 * UiStatCard
 * Carte de statistiques standardisée utilisant le Glassmorphism.
 * Utilisée pour afficher un chiffre clé avec une icône et un libellé au-dessus ou en dessous,
 * de manière empilée verticalement (text-center).
 */

interface Props {
  icon: string
  label: string
  value?: string | number
  iconColor?: string
  interactive?: boolean
  bgClass?: string
}

withDefaults(defineProps<Props>(), {
  iconColor: 'text-cyan-400',
  interactive: false,
  bgClass: ''
})
</script>

<template>
  <div
    class="glass-card p-4 text-center transition-transform duration-300"
    :class="[
      bgClass,
      interactive ? 'group hover:bg-white/10 hover:scale-105 cursor-default relative' : ''
    ]"
  >
    <Icon
      :name="icon"
      class="w-6 h-6 mx-auto mb-2"
      :class="[
        iconColor,
        interactive ? 'transition-transform duration-300 group-hover:scale-110' : ''
      ]"
    />
    <div class="text-white font-bold text-xl leading-none mb-1">
      <slot name="value">{{ value }}</slot>
    </div>
    <div class="text-white/60 text-xs leading-tight">
      <slot name="label">{{ label }}</slot>
    </div>
  </div>
</template>
