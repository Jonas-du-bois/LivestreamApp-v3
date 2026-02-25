<script setup lang="ts">
/**
 * ⚛️ UiDaySwitcher
 * Un composant atomique pour basculer entre les jours de la compétition.
 * Utilisé dans le programme et les résultats pour filtrer les données par jour.
 */

interface Props {
  modelValue: string
  days: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t, locale } = useI18n()
const { translateDay } = useTranslatedData()

const selectDay = (day: string) => {
  emit('update:modelValue', day)
}
</script>

<template>
  <div class="glass-card p-1 flex overflow-x-auto scrollbar-hide" role="tablist" :aria-label="t('common.day')">
    <button
      v-for="day in days"
      :key="`${day}-${locale}`"
      @click="selectDay(day)"
      class="flex-1 py-2.5 px-4 rounded-xl transition-all font-medium capitalize whitespace-nowrap focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none hover:-translate-y-0.5 active:scale-95"
      :class="modelValue === day
        ? 'bg-white/20 text-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120] shadow-lg'
        : 'text-white/60 hover:bg-white/10'"
      type="button"
      role="tab"
      :aria-selected="modelValue === day"
    >
      {{ translateDay(day) }}
    </button>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
