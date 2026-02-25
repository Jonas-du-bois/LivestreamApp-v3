<script setup lang="ts">
/**
 * ⚛️ ResultCard
 * Carte atomique pour afficher un résultat (podium ou classement complet).
 * Uniformisée avec SchedulePassageCard pour une cohérence UI.
 */
import type { PassageEnriched } from '~/types/api'

// Extension du type PassageEnriched pour inclure le rang et le score
export type PassageResult = PassageEnriched & { rank: number; score?: number | null }

interface Props {
  passage: PassageResult
  isPodium?: boolean
  interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isPodium: false,
  interactive: true
})

const emit = defineEmits<{
  'click:group': [groupId: string, apparatusCode?: string]
}>()

const { translateCategory } = useTranslatedData()

// --- Logic Helpers ---

const getMedalIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return { name: 'fluent:trophy-24-filled', class: 'text-yellow-400' }
    case 2:
      return { name: 'fluent:ribbon-24-filled', class: 'text-gray-300' }
    case 3:
      return { name: 'fluent:ribbon-24-filled', class: 'text-amber-600' }
    default:
      return null
  }
}

const getBorderClass = (rank: number) => {
  if (!props.isPodium) return ''
  switch (rank) {
    case 1: return 'border-yellow-400 border-2'
    case 2: return 'border-gray-300 border-2'
    case 3: return 'border-amber-600 border-2'
    default: return 'border-white/10'
  }
}

const handleClick = () => {
  if (props.passage.group?._id && props.interactive) {
    emit('click:group', props.passage.group._id, props.passage.apparatus?.code)
  }
}
</script>

<template>
  <UiGlassCard
    :interactive="interactive"
    class="rounded-2xl transition-all duration-300"
    :class="getBorderClass(passage.rank)"
    @click="handleClick"
    :id="`result-${passage._id}`"
  >
    <div class="flex items-center gap-4">
      <!-- Rank / Medal (Left Column - Uniform width with Schedule) -->
      <div class="flex items-center justify-center min-w-[60px] flex-shrink-0">
        <template v-if="isPodium && getMedalIcon(passage.rank)">
          <span class="sr-only">#{{ passage.rank }}</span>
          <Icon
            :name="getMedalIcon(passage.rank)!.name"
            class="w-8 h-8"
            :class="getMedalIcon(passage.rank)!.class"
          />
        </template>
        <span v-else class="text-white/40 font-bold text-xl">#{{ passage.rank }}</span>
      </div>

      <!-- Group Info (Middle Column - Flexible) -->
      <div class="flex-1 min-w-0">
        <h3 class="text-white font-bold text-lg leading-tight mb-0.5 truncate">
          {{ passage.group?.name }}
        </h3>
        <p class="text-white/60 text-sm truncate">
          {{ translateCategory(passage.group?.category) || translateCategory('MIXTE') }}
        </p>
      </div>

      <!-- Score (Right Column - Fixed) -->
      <div
        class="font-bold flex-shrink-0 text-right min-w-[60px]"
        :class="isPodium ? 'text-cyan-400 text-3xl' : 'text-white text-2xl'"
      >
        {{ typeof passage.score === 'number' ? passage.score.toFixed(2) : '0.00' }}
      </div>
    </div>
  </UiGlassCard>
</template>

<style scoped>
/* Score Flash Animation (copied from results.vue for encapsulation) */
:global(.score-flash) {
  animation: premium-pop 2s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
  z-index: 10;
}

:global(.score-flash::after) {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  transform: skewX(-20deg);
  animation: shine-sweep 1.5s ease-out;
  pointer-events: none;
}

@keyframes premium-pop {
  0% {
    transform: scale(1);
    border-color: rgba(255, 255, 255, 0.15);
    background-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 0 rgba(34, 211, 238, 0);
  }
  10% {
    transform: scale(1.02);
    border-color: rgba(34, 211, 238, 0.8);
    background-color: rgba(34, 211, 238, 0.15);
    box-shadow: 0 10px 30px -10px rgba(34, 211, 238, 0.5);
  }
  80% {
    border-color: rgba(34, 211, 238, 0.4);
    background-color: rgba(34, 211, 238, 0.05);
  }
  100% {
    transform: scale(1);
    border-color: rgba(255, 255, 255, 0.15);
    background-color: rgba(255, 255, 255, 0.1);
    box-shadow: none;
  }
}

@keyframes shine-sweep {
  0% { left: -100%; }
  100% { left: 200%; }
}
</style>
