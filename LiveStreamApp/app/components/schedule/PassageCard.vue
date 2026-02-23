<script setup lang="ts">
/**
 * ⚛️ SchedulePassageCard
 * Carte atomique pour afficher un passage dans le programme.
 * Reçoit un passage enrichi et expose les événements de navigation et favori.
 */
import type { PassageEnriched } from '~/types/api'

interface Props {
  passage: PassageEnriched
  isFavorite?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isFavorite: false
})

const emit = defineEmits<{
  'click:group': [groupId: string, apparatusCode?: string]
  'toggle:favorite': [passageId: string, event: Event]
}>()

const { t } = useI18n()
const { translateApparatus, formatLocalizedTime } = useTranslatedData()

// Computed values for safe rendering
const groupName = computed(() => props.passage.group?.name ?? '')
const groupId = computed(() => props.passage.group?._id ?? '')
const apparatusCode = computed(() => props.passage.apparatus?.code ?? '')
const apparatusName = computed(() => props.passage.apparatus?.name ?? '')
const translatedApparatus = computed(() => translateApparatus(apparatusCode.value, apparatusName.value))
const formattedTime = computed(() => formatLocalizedTime(props.passage.startTime))
const location = computed(() => props.passage.location ?? '')
const passageId = computed(() => props.passage._id ?? '')
const statusClass = computed(() => {
  switch (props.passage.status) {
    case 'LIVE': return 'schedule-passage-live'
    case 'FINISHED': return 'schedule-passage-finished'
    default: return ''
  }
})

const ariaLabel = computed(() =>
  t('schedule.openGroupDetails', {
    group: groupName.value,
    apparatus: translatedApparatus.value,
    time: formattedTime.value
  })
)

const handleClick = () => {
  if (groupId.value) {
    emit('click:group', groupId.value, apparatusCode.value || undefined)
  }
}

const handleFavoriteToggle = (event: Event) => {
  event.stopPropagation()
  if (passageId.value) {
    emit('toggle:favorite', passageId.value, event)
  }
}
</script>

<template>
  <UiGlassCard
    :interactive="true"
    :class="statusClass"
    :aria-label="ariaLabel"
    @click="handleClick"
  >
    <div class="flex items-start gap-4">
      <!-- Time & Location -->
      <div class="text-left min-w-[70px] flex-shrink-0">
        <div class="text-cyan-400 font-bold text-xl leading-tight">
          {{ formattedTime }}
        </div>
        <div v-if="location" class="text-white/50 text-xs mt-0.5">
          {{ location }}
        </div>
      </div>

      <!-- Group Info -->
      <div class="flex-1 min-w-0 pt-0.5">
        <h4 class="text-white font-bold text-base leading-tight mb-1.5">
          {{ groupName }}
        </h4>
        <div class="flex items-center gap-2 text-sm">
          <span class="text-white/60">{{ t('schedule.group') }}</span>
          <span class="text-white/40">•</span>
          <span class="text-purple-400">{{ translatedApparatus }}</span>
        </div>
        <!-- Live badge -->
        <div v-if="passage.status === 'LIVE'" class="mt-1.5">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            {{ t('home.live') }}
          </span>
        </div>
      </div>

      <!-- Favorite Button -->
      <div class="flex items-start pt-0.5 flex-shrink-0">
        <SparkHeart
          :active="isFavorite"
          :label="isFavorite
            ? t('schedule.removeFromFavorites', { name: groupName })
            : t('schedule.addToFavorites', { name: groupName })"
          @click.stop="handleFavoriteToggle"
        />
      </div>
    </div>
  </UiGlassCard>
</template>

<style scoped>
.schedule-passage-live {
  border-color: rgba(239, 68, 68, 0.3) !important;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.1);
  animation: pulse-live 2s ease-in-out infinite;
}

.schedule-passage-finished {
  opacity: 0.65;
  transition: opacity 0.5s ease;
}

@keyframes pulse-live {
  0%, 100% { box-shadow: 0 0 12px rgba(239, 68, 68, 0.1); }
  50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.25); }
}

/* Smooth transition when status changes */
:deep(.glass-card) {
  transition: border-color 0.4s ease, box-shadow 0.4s ease, opacity 0.4s ease;
}

@media (prefers-reduced-motion: reduce) {
  .schedule-passage-live {
    animation: none;
  }
}
</style>
