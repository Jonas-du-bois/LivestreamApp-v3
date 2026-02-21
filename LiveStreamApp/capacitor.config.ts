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
    // Config du plugin Preferences (stockage natif du token auth)
    Preferences: {
      group: 'CoupeDesBainsStorage'
    },
    // Config du plugin PushNotifications (FCM - Android/iOS)
    PushNotifications: {
      // Afficher le badge sur l'icône de l'app (iOS)
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
