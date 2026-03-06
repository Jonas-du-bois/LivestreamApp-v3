import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fsg.coupedesbains',
  appName: 'Coupe des Bains',
  webDir: '.output/public',

  // En développement, décommenter pour live reload depuis le serveur Render
  // server: {
  //   url: 'https://livestreamapp-v3.onrender.com',
  //   cleartext: false
  // },

  android: {
    // Autorise les connexions HTTPS vers ton API Render
    allowMixedContent: false,
    // Edge-to-edge : la WebView s'étend derrière les barres système
    backgroundColor: '#0B1120',
  },

  plugins: {
    // Config du plugin Preferences (stockage natif du token auth + favoris)
    Preferences: {
      group: 'CoupeDesBainsStorage'
    },
    // Config du plugin PushNotifications (FCM - Android/iOS)
    PushNotifications: {
      // Afficher le badge sur l'icône de l'app (iOS)
      presentationOptions: ['badge', 'sound', 'alert']
    },
    // Config du plugin SplashScreen natif
    SplashScreen: {
      // On gère le masquage manuellement (après que l'app soit prête)
      launchAutoHide: false,
      // Durée d'animation de fondu en sortie (ms)
      fadeOutDuration: 500,
      // Couleur de fond identique au thème de l'app
      backgroundColor: '#0B1120',
      // Android : afficher le splash en plein écran (pas de barre de statut)
      androidSplashResourceName: 'splash',
      showSpinner: false,
      // iOS : utiliser la Launch Image native
      iosSpinnerStyle: 'small',
      spinnerColor: '#06B6D4'
    }
  }
};

export default config;
