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
  color?: 'cyan' | 'blue' | 'violet' | 'emerald'
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Filtres',
  variant: 'pill',
  color: 'violet'
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
  if (props.color === 'emerald') {
    return 'ui-filter-chip--emerald'
  }
  if (props.color === 'cyan' || props.color === 'blue') {
    return 'ui-filter-chip--cyan'
  }
  return 'ui-filter-chip--violet'
})

const focusRingClasses = computed(() => {
  if (props.color === 'emerald') {
    return 'app-focus-ring app-focus-ring-tertiary'
  }
  if (props.color === 'violet') {
    return 'app-focus-ring app-focus-ring-secondary'
  }
  return 'app-focus-ring'
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
      class="ui-filter-chip relative px-4 py-2 rounded-full text-sm font-bold flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] active:scale-95 border"
      :class="[
        focusRingClasses,
        isSelected(item.id)
          ? colorClasses
          : 'ui-filter-chip--inactive backdrop-blur-xl'
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

.ui-filter-chip--inactive {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
}

.ui-filter-chip--inactive:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.ui-filter-chip--cyan {
  background: rgba(6, 182, 212, 0.15);
  border-color: rgba(6, 182, 212, 0.3);
  color: rgb(103, 232, 249); /* cyan-300 */
}

.ui-filter-chip--violet {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
  color: rgb(167, 139, 250); /* violet-400 */
}

.ui-filter-chip--emerald {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
  color: rgb(110, 231, 183); /* emerald-300 */
}
</style>
