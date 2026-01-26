<script setup lang="ts">
interface Blob {
  id: number
  size: number
  initialX: string
  initialY: string
  gradient: string
  duration: number
}

const blobs: Blob[] = [
  {
    id: 1,
    size: 400,
    initialX: '20%',
    initialY: '10%',
    gradient: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(139, 92, 246, 0.3) 100%)',
    duration: 20
  },
  {
    id: 2,
    size: 500,
    initialX: '70%',
    initialY: '60%',
    gradient: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(6, 182, 212, 0.3) 100%)',
    duration: 25
  },
  {
    id: 3,
    size: 350,
    initialX: '50%',
    initialY: '80%',
    gradient: 'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, rgba(139, 92, 246, 0.4) 100%)',
    duration: 30
  }
]
</script>

<template>
  <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div
      v-for="blob in blobs"
      :key="blob.id"
      class="absolute rounded-full blur-3xl animate-blob"
      :style="{
        width: `${blob.size}px`,
        height: `${blob.size}px`,
        left: blob.initialX,
        top: blob.initialY,
        background: blob.gradient,
        animationDuration: `${blob.duration}s`
      }"
    />
  </div>
</template>

<style scoped>
@keyframes blob {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(50px, -50px) scale(1.1);
  }
  50% {
    transform: translate(-50px, 50px) scale(0.9);
  }
  75% {
    transform: translate(50px, 50px) scale(1.05);
  }
}

.animate-blob {
  animation: blob ease-in-out infinite;
}
</style>
