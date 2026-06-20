<script setup lang="ts">
interface Props {
  icon?: string;
  iconColor?: string;
  title?: string;
  description?: string;
  padding?: string;
  panelClass?: string;
}

withDefaults(defineProps<Props>(), {
  iconColor: 'text-white/30',
  padding: 'p-8',
  panelClass: 'glass-panel'
})
</script>

<template>
  <div :class="[panelClass, padding, 'text-center']">
    <Icon v-if="icon" :name="icon" :class="['w-16 h-16 mx-auto mb-4', iconColor]" />
    <h2 v-if="title" class="text-white font-bold text-xl mb-2">{{ title }}</h2>
    <p v-if="description" class="text-white/60" :class="{ 'mb-6': $slots.default }">{{ description }}</p>
    <slot />
  </div>
</template>
