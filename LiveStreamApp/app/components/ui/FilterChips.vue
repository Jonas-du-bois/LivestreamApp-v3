<script setup lang="ts">
/**
 * UiFilterChips
 * Barre de navigation horizontale pour filtres ou onglets sous forme de "pilules" cliquables.
 */

interface FilterItem {
  id: string | number
  label: string
  [key: string]: unknown
}

interface Props {
  items: FilterItem[]
  modelValue: string | number
  ariaLabel?: string
  variant?: 'pill' | 'glass'
  color?: 'cyan' | 'blue'
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Filtres',
  variant: 'pill',
  color: 'cyan'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const isSelected = (id: string | number) => props.modelValue === id

const select = (id: string | number) => {
  emit('update:modelValue', id)
}

// Détermine la palette de couleurs à appliquer lorsque la pilule est active.
const colorClasses = computed(() => {
  if (props.color === 'blue') {
    return 'bg-blue-600/80 border-blue-400/50 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/50'
  }
  return 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
})

const focusRingClasses = computed(() => {
  if (props.color === 'blue') {
    return 'focus-visible:ring-blue-400'
  }
  return 'focus-visible:ring-cyan-400'
})
</script>

<template>
  <div 
    class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scroll-smooth no-scrollbar scrollbar-hide pt-2"
    role="tablist"
    :aria-label="ariaLabel"
  >
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      role="tab"
      :aria-selected="isSelected(item.id)"
      class="relative px-4 py-2 rounded-full text-sm font-bold flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120] active:scale-95 border"
      :class="[
        focusRingClasses,
        isSelected(item.id)
          ? colorClasses
          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] active:bg-white/15 active:shadow-[0_0_20px_rgba(6,182,212,0.2)] backdrop-blur-xl'
      ]"
      @click="select(item.id)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
