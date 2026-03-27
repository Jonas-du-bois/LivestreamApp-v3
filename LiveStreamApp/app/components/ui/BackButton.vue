<script setup lang="ts">
/**
 * UiBackButton
 * Bouton de retour standardisé et robuste avec effet glassmorphism optionnel.
 * Gère la navigation de manière programmatique pour éviter les conflits d'événements.
 */
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{
  to?: string | null
  label?: string
  glass?: boolean
}>(), {
  to: null,
  label: 'Retour',
  glass: true
})

const router = useRouter()
const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const handleClick = (event: MouseEvent) => {
  emit('click', event)
  
  if (props.to) {
    router.push(props.to)
  } else {
    try {
      if (window.history.length > 1) {
        router.back()
      } else {
        router.push('/')
      }
    } catch (e) {
      router.push('/')
    }
  }
}

const commonClasses = computed(() => [
  'ui-back-button app-focus-ring inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 active:scale-95 text-white shadow-lg group focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120] outline-none',
  props.glass ? 'glass-panel ui-back-button--glass border border-white/10' : 'ui-back-button--plain'
])
</script>

<template>
  <button
    type="button"
    :class="commonClasses"
    @click="handleClick"
  >
    <Icon
      name="fluent:chevron-left-24-regular"
      class="ui-back-button__icon w-5 h-5 text-white transition-transform duration-300 group-hover:-translate-x-1 group-active:-translate-x-2 group-active:scale-90"
    />
    <span class="text-sm font-medium">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<style scoped>
.ui-back-button {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.ui-back-button--glass {
  background:
    radial-gradient(circle at top right, rgb(var(--color-secondary-rgb) / 0.16), transparent 40%),
    linear-gradient(165deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.07) 55%, rgba(11, 17, 32, 0.22) 100%);
}

.ui-back-button--glass:hover {
  border-color: rgb(var(--color-primary-rgb) / 0.28);
  box-shadow:
    0 18px 32px rgb(var(--color-primary-rgb) / 0.12),
    0 10px 20px rgb(var(--color-secondary-rgb) / 0.1);
}

.ui-back-button--glass:active {
  border-color: rgb(var(--color-secondary-rgb) / 0.34);
}

.ui-back-button--plain:hover {
  background: linear-gradient(135deg, rgb(var(--color-primary-rgb) / 0.12), rgb(var(--color-secondary-rgb) / 0.08));
}

.ui-back-button--plain:active {
  background: linear-gradient(135deg, rgb(var(--color-primary-rgb) / 0.18), rgb(var(--color-secondary-rgb) / 0.12));
}

.ui-back-button:hover .ui-back-button__icon {
  color: var(--color-primary);
}
</style>
