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
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgb(255 255 255 / 0.62);
}

.ui-filter-chip--inactive:hover {
  background: linear-gradient(135deg, rgb(var(--color-secondary-rgb) / 0.08), rgba(255, 255, 255, 0.08));
  border-color: rgb(var(--color-secondary-rgb) / 0.2);
  color: #ffffff;
  box-shadow: 0 0 18px rgb(var(--color-secondary-rgb) / 0.12);
}

.ui-filter-chip--cyan {
  background: linear-gradient(135deg, rgb(var(--color-primary-rgb) / 0.96), rgb(var(--color-secondary-rgb) / 0.82));
  border-color: rgb(var(--color-primary-rgb) / 0.58);
  color: #ffffff;
  box-shadow:
    0 0 20px rgb(var(--color-primary-rgb) / 0.34),
    0 10px 20px rgb(var(--color-secondary-rgb) / 0.14);
}

.ui-filter-chip--violet {
  background: linear-gradient(135deg, rgb(var(--color-secondary-rgb) / 0.96), rgb(var(--color-primary-rgb) / 0.76));
  border-color: rgb(var(--color-secondary-rgb) / 0.6);
  color: #ffffff;
  box-shadow:
    0 0 20px rgb(var(--color-secondary-rgb) / 0.34),
    0 10px 20px rgb(var(--color-primary-rgb) / 0.14);
}

.ui-filter-chip--emerald {
  background: linear-gradient(135deg, rgb(var(--color-tertiary-rgb) / 0.96), rgb(var(--color-primary-rgb) / 0.82));
  border-color: rgb(var(--color-tertiary-rgb) / 0.6);
  color: #ffffff;
  box-shadow:
    0 0 20px rgb(var(--color-tertiary-rgb) / 0.3),
    0 10px 20px rgb(var(--color-primary-rgb) / 0.14);
}
</style>
