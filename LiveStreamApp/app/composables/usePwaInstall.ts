// Composable pour gérer l'installation PWA depuis n'importe quel composant
// Utilise le web component @khmyznikov/pwa-install

interface PWAInstallElement extends HTMLElement {
  showDialog: (force?: boolean) => void
  hideDialog: () => void
}

export const usePwaInstall = () => {
  const isInstalled = ref(false)
  const isInstallAvailable = ref(false)
  const isIOS = ref(false)
  const isAndroid = ref(false)
  const isStandalone = ref(false)

  // Détection de la plateforme
  const detectPlatform = () => {
    if (import.meta.client) {
      const userAgent = navigator.userAgent.toLowerCase()
      isIOS.value = /iphone|ipad|ipod/.test(userAgent)
      isAndroid.value = /android/.test(userAgent)
      
      // Vérifier si l'app est déjà en mode standalone
      isStandalone.value = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
        
      // Si déjà en mode standalone, considérer comme installé
      if (isStandalone.value) {
        isInstalled.value = true
      }
    }
  }

  // Obtenir l'élément pwa-install
  const getPwaInstallElement = (): PWAInstallElement | null => {
    if (import.meta.client) {
      return document.querySelector('pwa-install') as PWAInstallElement | null
    }
    return null
  }

  // Ouvrir le dialogue d'installation
  const showInstallPrompt = (force = false) => {
    const element = getPwaInstallElement()
    if (element) {
      element.showDialog(force)
    }
  }

  // Fermer le dialogue
  const hideInstallPrompt = () => {
    const element = getPwaInstallElement()
    if (element) {
      element.hideDialog()
    }
  }

  // Initialisation
  onMounted(() => {
    detectPlatform()
    
    // Écouter les événements de disponibilité d'installation
    if (import.meta.client) {
      const element = getPwaInstallElement()
      if (element) {
        element.addEventListener('pwa-install-available-event', () => {
          isInstallAvailable.value = true
        })
        
        element.addEventListener('pwa-install-success-event', () => {
          isInstalled.value = true
          isInstallAvailable.value = false
        })
      }
    }
  })

  return {
    // États
    isInstalled: readonly(isInstalled),
    isInstallAvailable: readonly(isInstallAvailable),
    isIOS: readonly(isIOS),
    isAndroid: readonly(isAndroid),
    isStandalone: readonly(isStandalone),
    
    // Actions
    showInstallPrompt,
    hideInstallPrompt
  }
}
