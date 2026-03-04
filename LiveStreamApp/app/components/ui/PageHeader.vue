<script setup lang="ts">
/**
 * ⚛️ UiPageHeader
 * Composant standardisé pour les en-têtes de page avec titre, sous-titre et icône en filigrane animée.
 */

interface Props {
  /** Titre principal de la page */
  title: string
  /** Sous-titre ou description courte (optionnel) */
  subtitle?: string
  /** Icône Fluent affichée en grand en arrière-plan (ex: 'fluent:camera-24-filled') */
  icon?: string
  /** Couleur Tailwind pour l'icône de fond (ex: 'text-cyan-500') */
  iconColor?: string
  /** Couleur Tailwind pour le point d'accent final du titre (ex: 'text-cyan-500') */
  accentColor?: string
}

withDefaults(defineProps<Props>(), {
  subtitle: undefined,
  icon: undefined,
  iconColor: 'text-cyan-500',
  accentColor: 'text-cyan-500'
})
</script>

<template>
  <div class="relative py-6 mb-4">
    <!-- Glow décoration -->
    <div
      v-if="icon"
      class="pointer-events-none absolute top-0 right-0 p-6 opacity-20"
      aria-hidden="true"
    >
      <Icon
        :name="icon"
        class="text-9xl blur-2xl animate-pulse"
        :class="iconColor"
      />
    </div>

    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-white mb-2 uppercase tracking-wide">
          {{ title }}<span :class="accentColor">.</span>
        </h1>
        <p v-if="subtitle" class="text-white/60 text-sm max-w-xs">
          {{ subtitle }}
        </p>
      </div>

      <!-- Slot pour un badge (ex: LIVE) -->
      <div v-if="$slots.badge" class="flex-shrink-0 pt-1">
        <slot name="badge" />
      </div>
    </div>

    <!-- Slot pour du contenu sous le titre (ex: dernière mise à jour) -->
    <slot name="bottom" />
  </div>
</template>
