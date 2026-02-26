<script setup lang="ts">
/**
 * ⚛️ UiNetworkToast
 * Composant global pour afficher l'état de la connexion réseau.
 * Avertit l'utilisateur en cas de perte de connexion ou de signal faible.
 */
import { useNetworkStatus } from '~/composables/useNetworkStatus'

const { status } = useNetworkStatus()
const { t } = useI18n()

// Auto-hide the "poor" status after 10 seconds to not be too annoying
const showPoorWarning = ref(true)
let poorTimeout: ReturnType<typeof setTimeout> | null = null

watch(status, (newStatus) => {
  if (newStatus === 'poor') {
    showPoorWarning.value = true
    if (poorTimeout) clearTimeout(poorTimeout)
    poorTimeout = setTimeout(() => {
      showPoorWarning.value = false
    }, 10000)
  }
})

const isVisible = computed(() => {
  return status.value === 'offline' || (status.value === 'poor' && showPoorWarning.value)
})

const alertConfig = computed(() => {
  if (status.value === 'offline') {
    return {
      icon: 'fluent:wifi-off-24-regular',
      colorClass: 'bg-red-500/90 border-red-500',
      title: t('network.offlineTitle', 'Vous êtes hors ligne'),
      message: t('network.offlineMessage', 'Les données affichées (programme, résultats) peuvent ne pas être à jour. Le flux vidéo direct est indisponible sans connexion.')
    }
  }
  return {
    icon: 'fluent:wifi-warning-24-regular',
    colorClass: 'bg-amber-500/90 border-amber-500',
    title: t('network.poorTitle', 'Connexion faible'),
    message: t('network.poorMessage', 'Votre connexion est instable. Le flux vidéo peut s\'interrompre et les résultats mettre plus de temps à s\'actualiser.')
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="toast-slide">
      <div
        v-if="isVisible"
        class="fixed top-16 left-0 right-0 z-[100] px-4 pointer-events-none flex justify-center"
      >
        <div 
          class="max-w-md w-full glass-card border shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden pointer-events-auto"
          :class="alertConfig.colorClass"
        >
          <div class="p-4 flex items-start gap-3">
            <div class="mt-0.5 flex-shrink-0">
              <Icon :name="alertConfig.icon" class="w-6 h-6 text-white" />
            </div>
            <div class="flex-1">
              <h3 class="text-white font-bold text-sm mb-1">{{ alertConfig.title }}</h3>
              <p class="text-white/90 text-xs leading-relaxed">
                {{ alertConfig.message }}
              </p>
            </div>
            <button 
              v-if="status === 'poor'" 
              @click="showPoorWarning = false"
              class="flex-shrink-0 text-white/70 hover:text-white transition-colors"
            >
              <Icon name="fluent:dismiss-20-regular" class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-slide-leave-active {
  transition: all 0.3s ease-in;
}
.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}
</style>
