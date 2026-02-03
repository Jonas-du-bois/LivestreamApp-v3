<script setup lang="ts">
const pwaInstallRef = ref<InstanceType<typeof import('./components/PwaInstallPrompt.vue').default> | null>(null)

// Optionnel: Stocker si l'utilisateur a déjà vu/refusé le prompt
const hasSeenInstallPrompt = useCookie('pwa-install-seen', {
  default: () => false,
  maxAge: 60 * 60 * 24 * 30 // 30 jours
})

const handleInstallSuccess = () => {
  console.log('✅ PWA installée avec succès!')
  hasSeenInstallPrompt.value = true
}

const handleUserChoice = (choice: 'accepted' | 'dismissed') => {
  console.log('Choix utilisateur:', choice)
  if (choice === 'dismissed') {
    hasSeenInstallPrompt.value = true
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0B1120] relative overflow-hidden">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage :keepalive="{ max: 10 }" />
    </NuxtLayout>
    
    <!-- PWA Install Prompt - Visible sur tous les appareils compatibles -->
    <PwaInstallPrompt 
      ref="pwaInstallRef"
      @install-success="handleInstallSuccess"
      @user-choice-result="handleUserChoice"
    />
  </div>
</template>
