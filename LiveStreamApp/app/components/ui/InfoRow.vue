<script setup lang="ts">
/**
 * UiInfoRow
 * A reusable key-value row for lists.
 */
defineProps<{
  /** Left-aligned label */
  label: string
  /** Right-aligned value */
  value?: string
}>()
</script>

<template>
  <div class="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0">
    <p class="text-white/70 text-sm min-w-36">{{ label }}</p>
    <p class="text-white text-sm text-right">
      <slot>{{ value }}</slot>
    </p>
  </div>
</template>
