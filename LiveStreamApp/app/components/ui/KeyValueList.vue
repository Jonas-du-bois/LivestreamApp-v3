<script setup lang="ts">
interface KeyValueItem {
  [key: string]: any
}

interface Props {
  items: KeyValueItem[]
  labelKey?: string
  valueKey?: string
  variant?: 'default' | 'dashed'
  valueClasses?: string
  labelClasses?: string
}

const props = withDefaults(defineProps<Props>(), {
  labelKey: 'label',
  valueKey: 'value',
  variant: 'default',
  valueClasses: 'text-white text-sm text-right',
  labelClasses: 'text-white/70 text-sm min-w-36'
})
</script>

<template>
  <ul class="space-y-3">
    <li
      v-for="(item, idx) in items"
      :key="idx"
      :class="[
        variant === 'dashed' ? 'flex items-end justify-between text-sm group/item' : 'flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0'
      ]"
    >
      <span :class="[variant === 'dashed' && labelClasses === 'text-white/70 text-sm min-w-36' ? 'text-white/90 font-medium relative pr-2 z-10' : labelClasses]">
        <slot name="label" :item="item" :index="idx">
          {{ item[labelKey] }}
        </slot>
      </span>

      <span
        v-if="variant === 'dashed'"
        class="flex-grow border-b border-dashed border-white/10 mb-1 mx-1"
      ></span>

      <span :class="valueClasses">
        <slot name="value" :item="item" :index="idx">
          {{ item[valueKey] }}
        </slot>
      </span>
    </li>
  </ul>
</template>
