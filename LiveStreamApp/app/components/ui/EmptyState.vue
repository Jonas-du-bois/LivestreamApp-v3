<script setup lang="ts">
/**
 * ⚛️ UiEmptyState
 * Composant standard pour les listes vides ou l'absence de résultats.
 */

interface Props {
  /** Titre principal */
  title: string
  /** Description détaillée */
  description?: string
  /** Icône Fluent (ex: 'fluent:search-24-regular') */
  icon?: string
  /** Affiche une bordure glass-card (par défaut: true) */
  glass?: boolean
}

withDefaults(defineProps<Props>(), {
  description: '',
  icon: 'fluent:info-24-regular',
  glass: true
})
</script>

<template>
  <div 
    class="text-center p-8 transition-all"
    :class="[glass ? 'glass-card' : '']"
  >
    <!-- Icon Circle -->
    <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/5">
      <Icon :name="icon" class="h-8 w-8 text-white/40" />
    </div>

    <!-- Text Content -->
    <h3 class="text-white text-lg font-bold">
      {{ title }}
    </h3>

    <p v-if="description" class="mt-2 text-sm text-white/60 max-w-xs mx-auto leading-relaxed">
      {{ description }}
    </p>

    <!-- Actions Slot (Buttons, Links) -->
    <div v-if="$slots.actions" class="mt-6 flex justify-center">
      <slot name="actions" />
    </div>
  </div>
</template>
