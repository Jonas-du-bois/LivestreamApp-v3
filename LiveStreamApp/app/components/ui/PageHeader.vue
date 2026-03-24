<script setup lang="ts">
/**
 * UiPageHeader
 * Composant d'en-tête de page standardisé affichant un titre, une description optionnelle et une icône floutée en filigrane pour l'esthétique.
 */

interface Props {
  title: string
  subtitle?: string
  icon?: string
  iconColor?: string
  accentColor?: string
}

withDefaults(defineProps<Props>(), {
  subtitle: undefined,
  icon: undefined,
  iconColor: 'accent-text-secondary',
  accentColor: 'accent-text-primary'
})
</script>

<template>
  <div class="ui-page-header relative isolate overflow-hidden py-6 mb-4">
    <div class="ui-page-header__wash pointer-events-none absolute -top-12 right-0 w-56 h-40 rounded-full" aria-hidden="true" />

    <!-- Glow décoratif en arrière-plan -->
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

      <!-- Emplacement optionnel pour un badge d'état (ex: LIVE) dans le header -->
      <div v-if="$slots.badge" class="flex-shrink-0 pt-1">
        <slot name="badge" />
      </div>
    </div>

    <!-- Emplacement pour injecter du contenu sous le bloc titre (ex: dernière mise à jour) -->
    <slot name="bottom" />
  </div>
</template>

<style scoped>
.ui-page-header__wash {
  background: linear-gradient(135deg, rgb(var(--color-secondary-rgb) / 0.32), rgb(var(--color-primary-rgb) / 0.18));
  filter: blur(48px);
  opacity: 0.65;
}
</style>
