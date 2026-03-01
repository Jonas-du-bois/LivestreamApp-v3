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
  'inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 active:scale-95 text-white shadow-lg group outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120]',
  props.glass ? 'glass-panel bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/20 hover:border-white/20 hover:shadow-cyan-500/20 active:bg-white/30 active:shadow-cyan-500/40' : 'hover:bg-white/10 active:bg-white/20'
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
      class="w-5 h-5 text-white transition-transform duration-300 group-hover:-translate-x-1 group-active:-translate-x-2 group-active:scale-90"
    />
    <span class="text-sm font-medium">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>
