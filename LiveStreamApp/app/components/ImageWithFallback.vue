<script setup lang="ts">
interface Props {
  src?: string
  alt?: string
}

const props = defineProps<Props>()
const src = toRef(props, 'src')
const alt = toRef(props, 'alt')

const didError = ref(false)

const ERROR_IMG_SRC = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

const handleError = () => {
  didError.value = true
}
</script>

<template>
  <div 
    v-if="didError" 
    class="inline-block bg-gray-100 text-center align-middle"
  >
    <div class="flex items-center justify-center w-full h-full">
      <img 
        :src="ERROR_IMG_SRC" 
        alt="Error loading image" 
        :data-original-url="src"
      />
    </div>
  </div>
  <img 
    v-else
    :src="src" 
    :alt="alt" 
    @error="handleError"
  />
</template>
