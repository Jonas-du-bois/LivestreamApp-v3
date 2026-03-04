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
  if (props.modelValue !== day) {
    emit('update:modelValue', day)
  }
}
</script>

<template>
  <div class="glass-card days-switcher p-1 flex items-center overflow-x-auto scrollbar-hide" role="tablist" :aria-label="t('common.day')">
    
    <div class="relative flex w-full">
      
      <div 
        class="absolute top-0 bottom-0 left-0 bg-white/20 border border-white/10 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] z-0"
        :style="{ 
          width: `${100 / days.length}%`, 
          transform: `translateX(${days.indexOf(modelValue) * 100}%)` 
        }"
        aria-hidden="true"
      ></div>

      <button
        v-for="day in days"
        :key="`${day}-${locale}`"
        @click="selectDay(day)"
        class="relative z-10 flex-1 py-2.5 px-4 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] font-medium capitalize whitespace-nowrap outline-none flex justify-center items-center"
        :class="modelValue === day
          ? 'text-white drop-shadow-md' 
          : 'text-white/60 hover:text-white/80 active:scale-95 active:text-white/90'"
        type="button"
        role="tab"
        :aria-selected="modelValue === day"
      >
        {{ translateDay(day) }}
      </button>

    </div>
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
.days-switcher {
  height: 3.2rem;
  border-radius: 10rem;
}

.days-switcher div {
  min-width: 4rem;
  border-radius: 10rem;
}
</style>