<script setup lang="ts">
import type { PassageEnriched } from '~/types/api'

interface Props {
  passage: PassageEnriched
  isPast?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isPast: false
})

const emit = defineEmits<{
  'click:group': [groupId: string]
  'toggle:favorite': [passageId: string, event: Event]
}>()

const { t } = useI18n()
const { translateApparatus, formatLocalizedTime, formatLocalizedDate } = useTranslatedData()

const formatTime = (dateStr: string) => {
  return formatLocalizedTime(dateStr)
}

const formatDate = (dateStr: string) => {
  return formatLocalizedDate(dateStr, { weekday: 'long', day: 'numeric' })
}

const handleGroupClick = () => {
  if (props.passage.group?._id) {
    emit('click:group', props.passage.group._id)
  }
}

const handleFavoriteToggle = (event: Event) => {
  event.stopPropagation()
  if (props.passage._id) {
    emit('toggle:favorite', props.passage._id, event)
  }
}
</script>

<template>
  <UiGlassCard
    class="flex items-center gap-4"
    :class="{ 'opacity-70': isPast }"
    :interactive="true"
    @click="handleGroupClick"
  >
    <div class="text-center min-w-[60px]">
       <div class="text-cyan-400 font-bold text-lg">{{ formatTime(passage.startTime) }}</div>
       <div class="text-white/40 text-xs uppercase">{{ formatDate(passage.startTime).split(' ')[0] }}</div>
    </div>

    <div class="flex-1 min-w-0">
      <h4 class="text-white font-bold mb-1">{{ passage.group?.name }}</h4>
      <div class="flex items-center gap-2 text-sm">
         <span class="text-white/60">{{ passage.location }}</span>
         <span class="text-white/40">•</span>
         <span class="text-purple-400">{{ translateApparatus(passage.apparatus?.code, passage.apparatus?.name) }}</span>
      </div>
    </div>

    <div class="flex items-start pt-0.5 flex-shrink-0">
      <SparkHeart
        :active="true"
        :label="t('favorites.removeFromFavorites', { name: passage.group?.name || '' })"
        @click.stop="handleFavoriteToggle"
      />
    </div>
  </UiGlassCard>
</template>
