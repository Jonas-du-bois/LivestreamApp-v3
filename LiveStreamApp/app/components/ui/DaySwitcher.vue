<script setup lang="ts">
/**
 * UiDaySwitcher
 * Composant à onglets stylisé pour basculer entre les jours de la compétition.
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

const { t } = useI18n()
// ⚠️ DEAD CODE : const { locale } = useI18n()
const { translateDay } = useTranslatedData()

const selectDay = (day: string) => {
  if (props.modelValue !== day) {
    emit('update:modelValue', day)
  }
}
</script>

<template>
  <div class="glass-card ui-day-switcher days-switcher p-1 flex items-center overflow-x-auto scrollbar-hide" role="tablist" :aria-label="t('common.day')">
    
    <div class="relative flex w-full days-switcher__track">
      
      <!-- Pillule animée marquant la sélection actuelle -->
      <div 
        class="days-switcher__thumb absolute top-0 bottom-0 left-0 rounded-xl transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] z-0"
        :style="{ 
          width: `${100 / days.length}%`, 
          transform: `translateX(${days.indexOf(modelValue) * 100}%)` 
        }"
        aria-hidden="true"
      ></div>

      <button
        v-for="day in days"
        :key="`${day}`"
        @click="selectDay(day)"
        class="days-switcher__button app-focus-ring app-focus-ring-secondary relative z-10 flex-1 py-2.5 px-4 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] font-medium capitalize whitespace-nowrap flex justify-center items-center"
        :class="modelValue === day
          ? 'days-switcher__button--active' 
          : 'days-switcher__button--inactive active:scale-95'"
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
  border-color: rgb(var(--color-secondary-rgb) / 0.14);
}

.days-switcher__track {
  min-width: 4rem;
  border-radius: 10rem;
}

.days-switcher__thumb {
  background: linear-gradient(135deg, rgb(var(--color-secondary-rgb) / 0.84), rgb(var(--color-primary-rgb) / 0.8));
  border: 1px solid rgb(var(--color-secondary-rgb) / 0.32);
  box-shadow:
    0 12px 24px rgb(var(--color-secondary-rgb) / 0.18),
    0 8px 18px rgb(var(--color-primary-rgb) / 0.12);
}

.days-switcher__button--active {
  color: #ffffff;
  text-shadow: 0 0 12px rgb(var(--color-secondary-rgb) / 0.28);
}

.days-switcher__button--inactive {
  color: rgb(255 255 255 / 0.62);
}

.days-switcher__button--inactive:hover {
  color: rgb(255 255 255 / 0.88);
}
</style>
