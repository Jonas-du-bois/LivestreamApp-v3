<script setup lang="ts">
/**
 * UiIconButton
 * Bouton contenant uniquement une icône, avec des styles unifiés et une gestion native de l'accessibilité.
 */

interface Props {
  icon: string
  iconSize?: string | number
  label: string
  variant?: 'ghost' | 'glass' | 'dark' | 'bubble'
  active?: boolean
  showBadge?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  iconSize: '20', 
  variant: 'ghost',
  active: false,
  showBadge: false
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const variantClasses = computed(() => {
  const maps: Record<string, string> = {
    ghost: 'hover:bg-white/10 text-white',
    glass: 'glass-card bg-white/10 hover:bg-white/20 text-white',
    dark: 'bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white',
    bubble: 'hover:bg-white/15 active:bg-white/25 text-white/90 rounded-full'
  }
  return maps[props.variant] || maps.ghost
})
</script>

<template>
  <button
    type="button"
    class="relative p-2 transition-all duration-200 active:scale-90 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120]"
    :class="[variantClasses, active ? 'bg-white/20' : '', variant === 'bubble' ? 'rounded-full' : 'rounded-lg']"
    :aria-label="label"
    @click="$emit('click', $event)"
  >
    <Icon 
      :name="icon" 
      :size="iconSize"
      class="transition-transform"
    />
    
    <span 
      v-if="showBadge"
      class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#0B1120]"
    ></span>

    <slot />
  </button>
</template>
