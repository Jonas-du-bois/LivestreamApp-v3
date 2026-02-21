<script setup lang="ts">
/**
 * ⚛️ UiFilterChips
 * Barre de navigation horizontale pour filtres ou onglets.
 */

interface FilterItem {
  id: string | number
  label: string
  [key: string]: any
}

interface Props {
  items: FilterItem[]
  modelValue: string | number
  ariaLabel?: string
  /** Variante visuelle : 'pill' (défaut) ou 'glass' */
  variant?: 'pill' | 'glass'
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Filtres',
  variant: 'pill'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const isSelected = (id: string | number) => props.modelValue === id

const select = (id: string | number) => {
  emit('update:modelValue', id)
}
</script>

<template>
  <div 
    class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scroll-smooth no-scrollbar scrollbar-hide"
    role="tablist"
    :aria-label="ariaLabel"
  >
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      role="tab"
      :aria-selected="isSelected(item.id)"
      class="px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-all outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120] hover:scale-105 active:scale-95"
      :class="[
        isSelected(item.id)
          ? 'bg-cyan-400 text-[#0B1120]'
          : 'glass-card text-white/80 hover:bg-white/10'
      ]"
      @click="select(item.id)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
/* Masquer la scrollbar tout en gardant le scroll fonctionnel */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
