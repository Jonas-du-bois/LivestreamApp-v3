<script setup lang="ts">
defineProps<{
  icon?: string
  iconColor?: string
  borderColor?: string
  bgClass?: string
}>()
</script>

<template>
  <div
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md text-white font-medium text-xs"
    :class="[borderColor || 'border-white/20', bgClass || 'bg-white/10']"
  >
    <Icon v-if="icon" :name="icon" class="w-4 h-4" :class="iconColor || 'text-white'" />
    <slot />
  </div>
</template>