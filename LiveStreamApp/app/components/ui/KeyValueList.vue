<script setup lang="ts">
/**
 * UiKeyValueList
 * A reusable component for displaying a list of key-value pairs with consistent spacing and dividers.
 * Originally extracted from `app/pages/infos.vue`.
 */

interface KeyValueItem {
  label: string
  value: string
}

interface Props {
  items: KeyValueItem[]
}

defineProps<Props>()
</script>

<template>
  <div
    v-for="item in items"
    :key="item.label"
    class="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0"
  >
    <p class="text-white/70 text-sm min-w-36">{{ item.label }}</p>
    <p class="text-white text-sm text-right">{{ item.value }}</p>
  </div>
</template>
