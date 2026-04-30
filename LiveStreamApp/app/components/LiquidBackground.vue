<script setup lang="ts">
/**
 * LiquidBackground
 * Fond d'écran animé avec des "blobs" (formes floues) flottants.
 */
interface Blob {
  id: number
  size: number
  initialX: string
  initialY: string
  gradient: string
  duration: number
}

// Configuration des orbes animés. Ces valeurs sont fixes pour garantir la stabilité de l'animation.
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
  <div class="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#0B1120] isolate">
    <div
      v-for="blob in blobs"
      :key="blob.id"
      class="absolute rounded-full blur-[64px] animate-blob will-change-transform"
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
.will-change-transform {
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}

@keyframes blob {
  0%, 100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  33% {
    transform: translate3d(30px, -50px, 0) scale(1.1);
  }
  66% {
    transform: translate3d(-20px, 20px, 0) scale(0.9);
  }
}

.animate-blob {
  animation: blob ease-in-out infinite;
}
</style>
