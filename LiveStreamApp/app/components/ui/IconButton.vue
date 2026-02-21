<script setup lang="ts">
/**
 * ⚛️ UiIconButton
 * Bouton d'icône standardisé avec effet Glassmorphism.
 */

interface Props {
  /** Nom de l'icône Iconify */
  icon: string
  /** Taille de l'icône (défaut: 5 pour w-5 h-5) */
  iconSize?: string | number
  /** Label pour l'accessibilité (obligatoire pour les boutons sans texte) */
  label: string
  /** Variante visuelle */
  variant?: 'ghost' | 'glass' | 'dark'
  /** État actif (ex: pour les filtres activés) */
  active?: boolean
  /** Afficher un point de notification */
  showBadge?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  iconSize: '20', // Équivalent à w-5 h-5
  variant: 'ghost',
  active: false,
  showBadge: false
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const variantClasses = computed(() => {
  const maps = {
    ghost: 'hover:bg-white/10 text-white',
    glass: 'glass-card bg-white/10 hover:bg-white/20 text-white',
    dark: 'bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white'
  }
  return maps[props.variant] || maps.ghost
})
</script>

<template>
  <button
    type="button"
    class="relative p-2 rounded-lg transition-all duration-200 active:scale-90 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
    :class="[variantClasses, active ? 'bg-white/20' : '']"
    :aria-label="label"
    @click="$emit('click', $event)"
  >
    <Icon 
      :name="icon" 
      :size="iconSize"
      class="transition-transform"
    />
    
    <!-- Badge de notification -->
    <span 
      v-if="showBadge"
      class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#0B1120]"
    ></span>

    <slot />
  </button>
</template>
