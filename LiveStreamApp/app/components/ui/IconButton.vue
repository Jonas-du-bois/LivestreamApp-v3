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
    ghost: 'ui-icon-button--ghost text-white',
    glass: 'glass-card ui-icon-button--glass text-white',
    dark: 'ui-icon-button--dark text-white',
    bubble: 'ui-icon-button--bubble text-white/90 rounded-full'
  }
  return maps[props.variant] || maps.ghost
})
</script>

<template>
  <button
    type="button"
    class="ui-icon-button app-focus-ring relative isolate overflow-hidden p-2 transition-all duration-200 active:scale-90 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120] outline-none"
    :class="[variantClasses, active ? 'ui-icon-button--active' : '', variant === 'bubble' ? 'rounded-full' : 'rounded-lg']"
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

<style scoped>
.ui-icon-button--ghost:hover {
  background: linear-gradient(135deg, rgb(var(--color-primary-rgb) / 0.12), rgb(var(--color-secondary-rgb) / 0.08));
}

.ui-icon-button--glass {
  border-color: rgb(var(--color-primary-rgb) / 0.16);
}

.ui-icon-button--glass:hover {
  background:
    radial-gradient(circle at top right, rgb(var(--color-primary-rgb) / 0.16), transparent 42%),
    linear-gradient(165deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.08) 60%, rgba(11, 17, 32, 0.14) 100%);
  border-color: rgb(var(--color-secondary-rgb) / 0.26);
}

.ui-icon-button--dark {
  background: linear-gradient(135deg, rgba(2, 6, 23, 0.65), rgba(11, 17, 32, 0.82));
  border: 1px solid rgb(var(--color-secondary-rgb) / 0.18);
  backdrop-filter: blur(12px);
}

.ui-icon-button--dark:hover {
  background: linear-gradient(135deg, rgb(var(--color-secondary-rgb) / 0.2), rgba(2, 6, 23, 0.78));
  border-color: rgb(var(--color-secondary-rgb) / 0.28);
}

.ui-icon-button--bubble {
  border: 1px solid transparent;
}

.ui-icon-button--bubble:hover {
  background: linear-gradient(135deg, rgb(var(--color-primary-rgb) / 0.16), rgb(var(--color-secondary-rgb) / 0.14));
  border-color: rgb(var(--color-primary-rgb) / 0.26);
  box-shadow:
    0 14px 26px rgb(var(--color-primary-rgb) / 0.16),
    0 10px 20px rgb(var(--color-secondary-rgb) / 0.12);
}

.ui-icon-button--active {
  background: linear-gradient(135deg, rgb(var(--color-primary-rgb) / 0.22), rgb(var(--color-secondary-rgb) / 0.18));
  border-color: rgb(var(--color-primary-rgb) / 0.32);
  box-shadow:
    0 12px 24px rgb(var(--color-primary-rgb) / 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
}
</style>
