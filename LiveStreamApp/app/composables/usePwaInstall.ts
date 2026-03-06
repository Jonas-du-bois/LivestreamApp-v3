/**
 * Installation PWA via le web component @khmyznikov/pwa-install.
 * Détecte la plateforme et expose les actions d'installation.
 */

interface PWAInstallElement extends HTMLElement {
  showDialog: (force?: boolean) => void
  hideDialog: () => void
}

export const usePwaInstall = () => {
  const isInstalled = ref(false)
  const isInstallAvailable = ref(false)
  const isStandalone = ref(false)

  const detectPlatform = () => {
    if (!import.meta.client) return

    // const userAgent = navigator.userAgent.toLowerCase()
    // isIOS.value = /iphone|ipad|ipod/.test(userAgent)
    // isAndroid.value = /android/.test(userAgent)

    // Mode standalone = déjà installée (PWA lancée depuis l'écran d'accueil)
    isStandalone.value = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (isStandalone.value) {
      isInstalled.value = true
    }
  }

  const getPwaInstallElement = (): PWAInstallElement | null => {
    if (!import.meta.client) return null
    return document.querySelector('pwa-install') as PWAInstallElement | null
  }

  const showInstallPrompt = (force = false) => {
    getPwaInstallElement()?.showDialog(force)
  }

  const hideInstallPrompt = () => {
    getPwaInstallElement()?.hideDialog()
  }

  onMounted(() => {
    detectPlatform()

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
    isInstalled: readonly(isInstalled),
    isInstallAvailable: readonly(isInstallAvailable),
    isStandalone: readonly(isStandalone),
    showInstallPrompt,
    hideInstallPrompt
  }
}
