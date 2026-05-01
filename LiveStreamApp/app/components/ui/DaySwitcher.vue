<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'

interface Props {
  days?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  days: () => []
})

// Use Vue 3.4+ defineModel for flawless v-model binding
const modelValue = defineModel<string>({ required: false, default: '' })

const { t } = useI18n()
const { translateDay } = useTranslatedData()

const safeDays = computed(() => props.days || [])

// Refs for sliding pill animation
const containerRef = ref<HTMLElement | null>(null)
const buttonsRef = ref<HTMLButtonElement[]>([])
const indicatorStyle = ref({ width: '0px', transform: 'translateX(0px)', opacity: 0 })

const updateIndicator = async () => {
  await nextTick()
  if (!safeDays.value.length || !buttonsRef.value.length) return
  
  const index = safeDays.value.indexOf(modelValue.value)
  // If modelValue not in list, fallback to first item
  const activeIndex = index >= 0 ? index : 0
  
  const activeButton = buttonsRef.value[activeIndex]
  if (activeButton && containerRef.value) {
    const containerRect = containerRef.value.getBoundingClientRect()
    const buttonRect = activeButton.getBoundingClientRect()
    
    // Calculate exact position relative to the scrollable container
    const left = buttonRect.left - containerRect.left + containerRef.value.scrollLeft
    
    indicatorStyle.value = {
      width: `${buttonRect.width}px`,
      transform: `translateX(${left}px)`,
      opacity: 1
    }
    
    // Auto-scroll the container to smoothly center the active tab if it's out of view
    const scrollTarget = left - (containerRect.width / 2) + (buttonRect.width / 2)
    containerRef.value.scrollTo({ left: scrollTarget, behavior: 'smooth' })
  }
}

// Watch both value and days array changes to adjust pill position
watch([modelValue, safeDays], () => {
  updateIndicator()
}, { immediate: true, deep: true })

onMounted(() => {
  // Give a tiny delay to ensure fonts and layouts are completely painted
  setTimeout(updateIndicator, 50)
  window.addEventListener('resize', updateIndicator)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIndicator)
})

const selectDay = (day: string) => {
  if (modelValue.value !== day) {
    // Haptic feedback for native-like feel
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try { window.navigator.vibrate(10) } catch(e) {}
    }
    modelValue.value = day
  }
}
</script>

<template>
  <div v-if="safeDays.length > 0" class="glass-card days-switcher p-1.5 flex items-center shadow-lg">
    <div 
      ref="containerRef" 
      class="relative flex w-full overflow-x-auto scrollbar-hide snap-x snap-mandatory" 
      role="tablist" 
      :aria-label="t('common.day')"
    >
      <!-- Pillule animée (Sliding background) -->
      <div 
        class="days-switcher__thumb absolute top-0 bottom-0 left-0 rounded-full transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-0"
        :style="{ 
          width: indicatorStyle.width, 
          transform: indicatorStyle.transform,
          opacity: indicatorStyle.opacity
        }"
        aria-hidden="true"
      ></div>

      <button
        v-for="(day, index) in safeDays"
        :key="`${day}`"
        :ref="el => { if (el) buttonsRef[index] = el as HTMLButtonElement }"
        @click="selectDay(day)"
        class="days-switcher__button snap-center relative z-10 flex-1 min-w-max py-2.5 px-6 rounded transition-colors duration-300 ease-out font-semibold capitalize whitespace-nowrap select-none"
        :class="modelValue === day
          ? 'text-white' 
          : 'text-white/60 hover:text-white/90 hover:bg-white/5 active:bg-white/10 active:scale-[0.98]'"
        type="button"
        role="tab"
        :aria-selected="modelValue === day"
      >
        <span class="relative z-10 tracking-wide text-sm md:text-base">{{ translateDay(day) }}</span>
      </button>
    </div>
  </div>
  
  <!-- Fallback Skeleton -->
  <div v-else class="glass-card days-switcher p-1.5 flex items-center shadow-lg animate-pulse">
    <div class="relative flex w-full h-[44px] bg-white/5 rounded-full overflow-hidden">
      <div class="absolute inset-0 -translate-x-full rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent shimmer-animation"></div>
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
  border-radius: 9999px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
}

.days-switcher__thumb {
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 9999px;
}

.days-switcher__button {
  -webkit-tap-highlight-color: transparent;
  border-radius: 9999px;
}
.days-switcher__button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: -2px;
  border-radius: 9999px;
}

.shimmer-animation {
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  100% { transform: translateX(100%); }
}
</style>