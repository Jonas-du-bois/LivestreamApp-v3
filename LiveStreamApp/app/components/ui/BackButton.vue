<script setup lang="ts">
/**
 * ⚛️ UiBackButton
 * Bouton de retour standardisé et robuste.
 * Gère la navigation de manière programmatique pour éviter les conflits d'événements.
 */
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{
  /** Chemin de redirection optionnel (ex: '/') */
  to?: string | null
  /** Texte affiché */
  label?: string
  /** Active l'effet Glassmorphism */
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
  // 1. Émettre l'événement pour les besoins spécifiques des parents
  emit('click', event)
  
  // 2. Gérer la navigation
  if (props.to) {
    router.push(props.to)
  } else {
    try {
      // Si on a une page précédente, on y retourne
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
  'inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 active:scale-95 text-white shadow-lg group',
  props.glass ? 'glass-panel bg-black/40 border border-white/10 hover:bg-white/20' : 'hover:bg-white/10'
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
      class="w-5 h-5 text-white transition-transform group-hover:-translate-x-0.5"
    />
    <span class="text-sm font-medium">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>
