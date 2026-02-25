<script setup lang="ts">
/**
 * ⚛️ UiButton
 * Bouton d'action standardisé.
 * Supporte les variantes Glass, Primary, Ghost et les états de chargement.
 */

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  rounded?: 'full' | 'xl' | 'lg' | 'md'
  to?: string
  icon?: string
  iconRight?: string
  loading?: boolean
  disabled?: boolean
  block?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'glass',
  size: 'md',
  rounded: 'xl',
  loading: false,
  disabled: false,
  block: false,
  type: 'button'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const variantClasses = computed(() => {
  const maps = {
    glass: 'glass-card hover:bg-white/20 active:bg-white/25 text-white border-white/10',
    primary: 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/20 border border-transparent',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/5',
    ghost: 'hover:bg-white/10 text-white border border-transparent',
    outline: 'border-2 border-white/20 hover:bg-white/10 text-white'
  }
  return maps[props.variant] || maps.glass
})

const sizeClasses = computed(() => {
  const maps = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2'
  }
  return maps[props.size] || maps.md
})

const roundedClasses = computed(() => `rounded-${props.rounded}`)

const commonClasses = computed(() => [
  'inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120]',
  variantClasses.value,
  sizeClasses.value,
  roundedClasses.value,
  props.block ? 'w-full' : '',
  props.loading ? 'cursor-wait' : ''
])
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :disabled="disabled || loading"
    :class="commonClasses"
    @click="emit('click', $event)"
  >
    <!-- Loading Spinner -->
    <Icon
      v-if="loading"
      name="svg-spinners:ring-resize"
      class="animate-spin"
      :size="size === 'sm' ? '16' : '20'"
    />

    <!-- Left Icon -->
    <Icon
      v-else-if="icon"
      :name="icon"
      :size="size === 'sm' ? '16' : '20'"
    />

    <!-- Content -->
    <slot />

    <!-- Right Icon -->
    <Icon
      v-if="iconRight && !loading"
      :name="iconRight"
      :size="size === 'sm' ? '16' : '20'"
    />
  </component>
</template>
