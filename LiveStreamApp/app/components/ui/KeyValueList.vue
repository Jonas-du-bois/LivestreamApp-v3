<script setup lang="ts">
interface KeyValueItem {
  label: string
  value?: string | number
  [key: string]: any
}

defineProps<{
  items: KeyValueItem[]
}>()
</script>

<template>
  <div>
    <div
      v-for="item in items"
      :key="item.label"
      class="flex items-start justify-between gap-4 border-b border-white/10 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0"
    >
      <p class="text-white/70 text-sm min-w-36">
        <slot name="label" :item="item">{{ item.label }}</slot>
      </p>
      <div class="text-white text-sm text-right">
        <slot name="value" :item="item">{{ item.value }}</slot>
      </div>
    </div>
  </div>
</template>
