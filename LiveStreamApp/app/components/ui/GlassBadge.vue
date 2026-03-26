<script setup lang="ts">
interface Props {
  icon?: string
  borderColor?: string
  iconColor?: string
  bgClass?: string
  textClass?: string
  paddingClass?: string
  iconSize?: string
}

withDefaults(defineProps<Props>(), {
  borderColor: 'border-white/10',
  bgClass: 'bg-black/40 backdrop-blur-md',
  textClass: 'text-xs font-bold uppercase text-white',
  paddingClass: 'px-3 py-1.5',
  iconSize: 'w-4 h-4'
})
</script>

<template>
  <div
    class="glass-panel rounded-full border flex items-center gap-2"
    :class="[borderColor, bgClass, paddingClass]"
  >
    <Icon
      v-if="icon"
      :name="icon"
      class="flex-shrink-0"
      :class="[iconColor || 'text-white', iconSize]"
    />
    <span :class="textClass">
      <slot />
    </span>
  </div>
</template>
