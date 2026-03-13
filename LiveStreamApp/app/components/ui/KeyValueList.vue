<script setup lang="ts">
import { computed } from 'vue'

export interface KeyValueItem {
  [key: string]: any
}

const props = withDefaults(defineProps<{
  items: KeyValueItem[]
  variant?: 'default' | 'dashed' | 'boxed'
  color?: 'white' | 'violet' | 'cyan' | 'blue'
  labelKey?: string
  valueKey?: string
}>(), {
  variant: 'default',
  color: 'white',
  labelKey: 'label',
  valueKey: 'value'
})

const itemClasses = computed(() => {
  if (props.variant === 'dashed') {
    return 'flex items-end justify-between text-sm group/item'
  }
  if (props.variant === 'boxed') {
    const bgColors: Record<string, string> = {
      violet: 'bg-violet-500/5 hover:bg-violet-500/10 border-violet-500/20',
      white: 'bg-white/5 hover:bg-white/10 border-white/10',
      cyan: 'bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-500/20',
      blue: 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20'
    }
    return `flex items-center justify-between p-3 rounded-xl transition-colors border ${bgColors[props.color] || bgColors.white}`
  }
  // default
  return 'flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0'
})

const labelClasses = computed(() => {
  if (props.variant === 'dashed') {
    return 'text-white/90 font-medium relative pr-2 z-10'
  }
  if (props.variant === 'boxed') {
    return 'text-white text-sm font-medium'
  }
  // default
  return 'text-white/70 text-sm min-w-36'
})

const valueClasses = computed(() => {
  if (props.variant === 'dashed') {
    const colors: Record<string, string> = {
      blue: 'text-blue-400',
      cyan: 'text-cyan-400',
      violet: 'text-violet-400',
      white: 'text-white'
    }
    return `font-bold pl-2 z-10 ${colors[props.color] || colors.white}`
  }
  if (props.variant === 'boxed') {
    return 'flex items-center gap-1.5'
  }
  // default
  return 'text-white text-sm text-right'
})
</script>

<template>
  <ul :class="[variant === 'boxed' ? 'space-y-2' : 'space-y-3']">
    <li
      v-for="(item, idx) in items"
      :key="idx"
      :class="itemClasses"
    >
      <!-- LABEL -->
      <div :class="labelClasses">
        <slot name="label" :item="item" :index="idx">
          {{ item[labelKey] }}
        </slot>
      </div>

      <!-- SEPARATOR (only for dashed variant) -->
      <slot name="separator" :item="item" :index="idx">
        <span v-if="variant === 'dashed'" class="flex-grow border-b border-dashed border-white/10 mb-1 mx-1"></span>
      </slot>

      <!-- VALUE -->
      <div :class="valueClasses">
        <slot name="value" :item="item" :index="idx">
          {{ item[valueKey] }}
        </slot>
      </div>
    </li>
  </ul>
</template>
