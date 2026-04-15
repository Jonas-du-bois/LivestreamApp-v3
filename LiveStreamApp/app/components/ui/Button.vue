<script setup lang="ts">
/**
 * UiButton
 * Bouton d'action standardisé du design system.
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
    glass: 'glass-card ui-button--glass text-white border-white/10',
    primary: 'ui-button--primary text-white border border-transparent',
    secondary: 'ui-button--secondary text-white border',
    ghost: 'ui-button--ghost text-white border border-transparent',
    outline: 'ui-button--outline text-white border'
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
  'ui-button group app-focus-ring relative isolate overflow-hidden inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
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
    :aria-busy="loading"
    :class="commonClasses"
    @click="emit('click', $event)"
  >
    <Icon
      v-if="loading"
      name="svg-spinners:ring-resize"
      class="animate-spin"
      :size="size === 'sm' ? '16' : '20'"
    />

    <Icon
      v-else-if="icon"
      :name="icon"
      :size="size === 'sm' ? '16' : '20'"
      class="transition-transform duration-200 group-active:scale-90"
    />

    <slot />

    <Icon
      v-if="iconRight && !loading"
      :name="iconRight"
      :size="size === 'sm' ? '16' : '20'"
      class="transition-transform duration-200 group-active:translate-x-1"
    />
  </component>
</template>

<style scoped>
.ui-button {
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.12);
}

.ui-button--primary {
  background: linear-gradient(135deg, rgb(var(--color-primary-rgb)) 0%, rgb(var(--color-secondary-rgb)) 100%);
  box-shadow:
    0 14px 30px rgb(var(--color-primary-rgb) / 0.2),
    0 8px 20px rgb(var(--color-secondary-rgb) / 0.12);
}

.ui-button--primary:hover {
  filter: brightness(1.05);
  box-shadow:
    0 18px 34px rgb(var(--color-primary-rgb) / 0.24),
    0 10px 24px rgb(var(--color-secondary-rgb) / 0.16);
}

.ui-button--secondary {
  background: linear-gradient(135deg, rgb(var(--color-secondary-rgb) / 0.26), rgb(var(--color-primary-rgb) / 0.16));
  border-color: rgb(var(--color-secondary-rgb) / 0.28);
  box-shadow: 0 14px 28px rgb(var(--color-secondary-rgb) / 0.12);
}

.ui-button--secondary:hover {
  background: linear-gradient(135deg, rgb(var(--color-secondary-rgb) / 0.34), rgb(var(--color-primary-rgb) / 0.2));
  border-color: rgb(var(--color-secondary-rgb) / 0.42);
}

.ui-button--glass {
  border-color: rgb(var(--color-primary-rgb) / 0.16);
}

.ui-button--glass:hover {
  background:
    radial-gradient(circle at top right, rgb(var(--color-primary-rgb) / 0.14), transparent 42%),
    linear-gradient(160deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.08) 52%, rgba(11, 17, 32, 0.18) 100%);
  border-color: rgb(var(--color-secondary-rgb) / 0.26);
  box-shadow: 0 16px 28px rgb(var(--color-secondary-rgb) / 0.12);
}

.ui-button--ghost:hover {
  background: linear-gradient(135deg, rgb(var(--color-primary-rgb) / 0.12), rgb(var(--color-secondary-rgb) / 0.08));
}

.ui-button--outline {
  background: rgb(var(--color-secondary-rgb) / 0.06);
  border-color: rgb(var(--color-secondary-rgb) / 0.4);
}

.ui-button--outline:hover {
  background: linear-gradient(135deg, rgb(var(--color-secondary-rgb) / 0.16), rgb(var(--color-primary-rgb) / 0.08));
  border-color: rgb(var(--color-secondary-rgb) / 0.58);
}

@media (prefers-reduced-motion: reduce) {
  .ui-button--primary:hover {
    filter: none;
  }
}
</style>
