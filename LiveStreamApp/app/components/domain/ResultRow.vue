<script setup lang="ts">
/**
 * ⚛️ DomainResultRow
 * Composant spécifique au domaine pour afficher une ligne de résultat.
 * Gère automatiquement les différences visuelles entre le podium (1-3) et le reste du classement.
 */

interface Props {
  rank: number
  groupName: string
  category: string
  score?: number
  /** ID pour l'animation flash lors de la mise à jour du score */
  id?: string
}

const props = defineProps<Props>()

// --- Logique visuelle ---

const isPodium = computed(() => props.rank <= 3)

const borderClass = computed(() => {
  if (!isPodium.value) return 'border-white/10' // Bordure par défaut pour le reste du classement

  switch (props.rank) {
    case 1: return 'border-yellow-400'
    case 2: return 'border-gray-300'
    case 3: return 'border-amber-600'
    default: return 'border-white/10'
  }
})

const medalIcon = computed(() => {
  switch (props.rank) {
    case 1: return { name: 'fluent:trophy-24-filled', class: 'text-yellow-400' }
    case 2: return { name: 'fluent:ribbon-24-filled', class: 'text-gray-300' }
    case 3: return { name: 'fluent:ribbon-24-filled', class: 'text-amber-600' }
    default: return null
  }
})

const scoreClass = computed(() => {
  return isPodium.value ? 'text-cyan-400 text-3xl' : 'text-white text-2xl'
})
</script>

<template>
  <UiGlassCard
    :id="id"
    class="rounded-2xl transition-all duration-300"
    :class="[isPodium ? 'border-2' : '', borderClass]"
    interactive
  >
    <div class="flex items-center gap-4">
      <!-- Indicateur de rang (Médaille ou Numéro) -->
      <div
        class="flex items-center justify-center shrink-0"
        :class="isPodium ? 'w-12 h-12' : 'w-12'"
      >
        <template v-if="isPodium && medalIcon">
          <span class="sr-only">#{{ rank }}</span>
          <Icon
            :name="medalIcon.name"
            class="w-8 h-8"
            :class="medalIcon.class"
          />
        </template>
        <template v-else>
          <span class="text-white/40 font-bold text-xl">#{{ rank }}</span>
        </template>
      </div>

      <!-- Informations Groupe -->
      <div class="flex-1 min-w-0">
        <h3 class="text-white font-bold text-lg truncate">{{ groupName }}</h3>
        <p class="text-white/60 text-sm truncate">{{ category }}</p>
      </div>

      <!-- Note -->
      <div class="font-bold shrink-0" :class="scoreClass">
        <slot name="score">
          {{ typeof score === 'number' ? score.toFixed(2) : '0.00' }}
        </slot>
      </div>
    </div>
  </UiGlassCard>
</template>
