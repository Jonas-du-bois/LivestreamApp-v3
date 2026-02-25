<script setup lang="ts">
import type { PassageEnriched } from '~/types/api'

interface Props {
  item: PassageEnriched & { _startTime?: number; _endTime?: number }
}

const props = defineProps<Props>()

const { t } = useI18n()
const { translateApparatus, formatLocalizedTime } = useTranslatedData()

const formatTime = (iso: string) => formatLocalizedTime(iso)

const statusLabel = computed(() => {
  if (props.item.status === 'LIVE') return t('group.inProgress')
  if (props.item.status === 'FINISHED') return ''
  return t('group.upcoming')
})
</script>

<template>
  <div class="relative pl-12">
    <!-- Icon Bubble -->
    <div
      class="absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 bg-[#0B1120] transition-all duration-500"
      :class="item.status === 'LIVE' ? 'border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-110' :
              item.status === 'FINISHED' ? 'border-cyan-400 text-cyan-400 opacity-60' : 'border-white/20 text-white/40'"
    >
      <Icon :name="item.apparatus?.icon || 'fluent:circle-24-regular'" class="w-5 h-5" />
    </div>

    <!-- Content Card -->
    <div 
      class="glass-card p-4 transition-all duration-500"
      :class="item.status === 'FINISHED' ? 'opacity-60 grayscale-[0.3]' : 'hover:bg-white/10'"
    >
      <div class="flex justify-between items-start gap-3">
        <div class="min-w-0 flex-1">
          <div class="font-bold text-white text-lg leading-tight mb-0.5 truncate">
            {{ translateApparatus(item.apparatus?.code, item.apparatus?.name) }}
          </div>
          <div class="text-xs text-white/50 flex items-center gap-1.5 flex-wrap">
            <div class="flex items-center gap-1">
              <Icon name="fluent:clock-24-regular" class="w-3.5 h-3.5" />
              <span>{{ formatTime(item.startTime) }}</span>
            </div>
            <span class="hidden xs:inline text-white/20">•</span>
            <div class="flex items-center gap-1">
              <Icon name="fluent:location-24-regular" class="w-3.5 h-3.5" />
              <span>{{ item.location || 'Salle 1' }}</span>
            </div>
          </div>
        </div>

        <div v-if="item.status === 'FINISHED'" class="text-right flex-shrink-0">
          <div class="text-2xl font-bold text-cyan-400 leading-none">
            {{ typeof item.score === 'number' ? item.score.toFixed(2) : '0.00' }}
          </div>
        </div>
        <div v-else-if="item.status === 'LIVE'" class="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 animate-pulse flex-shrink-0">
          🔴 {{ statusLabel }}
        </div>
        <div v-else class="text-white/40 text-sm italic flex-shrink-0">
          {{ statusLabel }}
        </div>
      </div>
    </div>
  </div>
</template>
