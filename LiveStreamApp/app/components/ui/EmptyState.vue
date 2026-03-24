<script setup lang="ts">
/**
 * UiEmptyState
 * Composant standard utilisé pour illustrer une liste vide ou l'absence de résultats (ex: recherche infructueuse).
 */

interface Props {
  title?: string
  description?: string
  icon?: string
  glass?: boolean
  pulse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  description: '',
  icon: 'fluent:info-24-regular',
  glass: true,
  pulse: false
})
</script>

<template>
  <div 
    class="ui-empty-state text-center p-8 transition-all flex flex-col items-center justify-center rounded-xl"
    :class="[glass ? 'glass-card' : 'ui-empty-state--plain', 'app-focus-ring']"
    role="status"
    aria-live="polite"
    tabindex="0"
  >
    <div
      class="ui-empty-state__icon mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border"
      :class="{ 'animate-pulse-slow': pulse }"
      aria-hidden="true"
    >
      <Icon :name="icon" class="h-8 w-8 accent-text-primary" />
    </div>

    <h3 v-if="title" class="text-white text-lg font-bold">
      {{ title }}
    </h3>

    <p v-if="description" class="mt-2 text-sm text-white/60 max-w-xs mx-auto leading-relaxed">
      {{ description }}
    </p>

    <!-- Slot permettant d'injecter des boutons d'actions personnalisés sous le texte (ex: "Réessayer") -->
    <div v-if="$slots.actions" class="mt-6 flex justify-center">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.ui-empty-state {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.ui-empty-state::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at top center, rgb(var(--color-secondary-rgb) / 0.16), transparent 36%),
    radial-gradient(circle at bottom right, rgb(var(--color-primary-rgb) / 0.12), transparent 34%);
}

.ui-empty-state--plain {
  background: transparent;
  border: 1px solid transparent;
  box-shadow: none;
}

.ui-empty-state__icon {
  background: linear-gradient(135deg, rgb(var(--color-primary-rgb) / 0.16), rgb(var(--color-secondary-rgb) / 0.18));
  border-color: rgb(var(--color-primary-rgb) / 0.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 12px 24px rgb(var(--color-primary-rgb) / 0.12);
}
</style>
