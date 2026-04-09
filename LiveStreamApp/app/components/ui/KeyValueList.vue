<script setup lang="ts">
export interface KeyValueItem {
  label: string
  value: string
}

defineProps<{
  items: KeyValueItem[]
}>()
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="item in items"
      :key="item.label"
      class="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0"
    >
      <p class="text-white/70 text-sm min-w-36">{{ item.label }}</p>
      <p class="text-white text-sm text-right">{{ item.value }}</p>
    </div>
  </div>
</template>
