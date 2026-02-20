<script setup lang="ts">
type CascadeLayout = 'vertical' | 'grid' | 'horizontal'

interface Props {
  count?: number
  layout?: CascadeLayout
  containerClass?: string
  itemClass?: string
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  count: 6,
  layout: 'vertical',
  containerClass: '',
  itemClass: '',
  ariaLabel: ''
})

const { t } = useI18n()

const items = computed(() => {
  const safeCount = Math.max(1, Number(props.count) || 1)
  return Array.from({ length: safeCount }, (_, index) => index)
})

const layoutClass = computed(() => {
  if (props.layout === 'grid') return 'grid grid-cols-1 gap-4'
  if (props.layout === 'horizontal') return 'flex gap-3 overflow-x-auto pb-2'
  return 'flex flex-col gap-2'
})

const resolvedAriaLabel = computed(() => props.ariaLabel || t('common.loading'))
</script>

<template>
  <div
    :class="[layoutClass, props.containerClass]"
    role="status"
    :aria-label="resolvedAriaLabel"
  >
    <span class="sr-only">{{ resolvedAriaLabel }}</span>

    <div
      v-for="index in items"
      :key="`cascade-skeleton-${index}`"
      class="premium-skeleton-card premium-cascade-item"
      :class="props.itemClass"
      :style="{ '--cascade-index': String(index) }"
    >
      <slot :index="index">
        <div class="p-4 flex items-start gap-4">
          <div class="premium-skeleton-surface premium-skeleton-shimmer w-16 h-12 rounded-lg flex-shrink-0"></div>
          <div class="flex-1 space-y-2 min-w-0">
            <div class="premium-skeleton-line premium-skeleton-shimmer w-3/4"></div>
            <div class="premium-skeleton-line premium-skeleton-shimmer w-1/2"></div>
            <div class="premium-skeleton-line premium-skeleton-shimmer w-1/3"></div>
          </div>
        </div>
      </slot>
    </div>
  </div>
</template>
