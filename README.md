# 🏆 Coupe des Bains

**Coupe des Bains** est une plateforme moderne et performante conçue pour le suivi en temps réel d'événements sportifs. Développée avec **Nuxt 4**, elle offre une expérience fluide tant sur le web (PWA) que sur mobile natif (Android & iOS via Capacitor).

## 🚀 Stack Technique

| Couche | Technologie |
|---|---|
| **Frontend** | [Nuxt 4](https://nuxt.com/) + [Tailwind CSS](https://tailwindcss.com/) |
| **Backend** | Nitro (intégré à Nuxt) + [Socket.io](https://socket.io/) |
| **Base de données** | MongoDB via [Mongoose](https://mongoosejs.com/) |
| **Mobile natif** | [Capacitor 8](https://capacitorjs.com/) (Android & iOS) |
| **Gestion d'état** | [Pinia](https://pinia.vuejs.org/) avec persistance |
| **PWA** | [@vite-pwa/nuxt](https://vite-pwa-org.netlify.app/frameworks/nuxt) + [Web Push (VAPID)](https://web-push-libs.org/) |
| **Analytics / Push natif** | Firebase Analytics + FCM ([`@capacitor-community/firebase-analytics`](https://github.com/capacitor-community/firebase-analytics)) |
| **Cartographie** | [Leaflet](https://leafletjs.com/) |
| **Graphiques** | [Chart.js](https://www.chartjs.org/) via [vue-chartjs](https://vue-chartjs.org/) |
| **i18n** | [@nuxtjs/i18n](https://i18n.nuxtjs.org/) — Français, Deutsch, Italiano |
| **Déploiement** | [Render.com](https://render.com/) |

## ✨ Fonctionnalités

- 📊 **Scores en Direct** — mise à jour instantanée via WebSockets + polling de secours
- 🎥 **Streaming** — intégration de flux vidéo (YouTube / embed) par salle
- 📅 **Programme** — calendrier complet des passages avec filtres (agrès, jour, division, salle)
- ❤️ **Favoris** — suivi personnalisé de groupes avec compte à rebours
- 🔔 **Notifications Push** — alertes natives (FCM) et web (VAPID) pour les favoris
- 🏅 **Résultats & Classements** — tableaux de scores avec graphiques d'historique
- 📱 **App-First** — PWA installable + applications natives Android/iOS
- 🗺️ **Plan Interactif** — localisation des sites de compétition
- 📸 **Photos** — galerie officielle via l'API Flickr
- 🛠️ **Dashboard Admin** — interface sécurisée pour la saisie des scores, gestion des streams et des passages
- 🌐 **Multilingue** — détection automatique de la langue du navigateur

## 🛠️ Installation

### Prérequis

- Node.js (LTS recommandé)
- Un serveur MongoDB accessible

### Variables d'environnement

Créez un fichier `.env` dans `LiveStreamApp/` :

```env
# ── Backend & Sécurité ────────────────────────────────────────────
MONGODB_URI=votre_uri_mongodb
NUXT_ADMIN_PASSWORD=votre_mot_de_passe_admin

# ── Notifications Push Web (VAPID) ───────────────────────────────
NUXT_VAPID_PRIVATE_KEY=votre_cle_privee_vapid
NUXT_PUBLIC_VAPID_PUBLIC_KEY=votre_cle_publique_vapid

# ── URLs publiques ────────────────────────────────────────────────
# Web : utiliser des chemins relatifs (/api)
# Capacitor : utiliser l'URL absolue du serveur de prod
NUXT_PUBLIC_API_BASE=https://votre-serveur.onrender.com/api
NUXT_PUBLIC_SOCKET_URL=https://votre-serveur.onrender.com

# ── Firebase (Analytics Web + FCM) ───────────────────────────────
NUXT_PUBLIC_FIREBASE_API_KEY=
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NUXT_PUBLIC_FIREBASE_PROJECT_ID=
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NUXT_PUBLIC_FIREBASE_APP_ID=
NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
FIREBASE_SERVICE_ACCOUNT=          # JSON stringifié du Service Account (serveur uniquement)

# ── Photos Flickr ─────────────────────────────────────────────────
FLICKR_API_KEY=
FLICKR_ALBUM_ID=
FLICKR_USER_ID=
```

### Lancement en développement

```bash
cd LiveStreamApp

# Installer les dépendances
npm install

# Démarrer le serveur de développement (SSR + API + Socket)
npm run dev
```

### Build de production (Web / Render)

```bash
npm run build
# Démarrer ensuite avec : node .output/server/index.mjs
```

## 📱 Capacitor — Applications Natives Android & iOS

L'application mobile est générée en **mode SPA statique** (SSR désactivé) et embarquée dans les projets natifs Android et iOS via Capacitor.

- **App ID** : `com.fsg.coupedesbains`
- **App Name** : `Coupe des Bains`
- **webDir** : `.output/public` (sortie de `nuxt generate`)

### Plugins Capacitor utilisés

| Plugin | Usage |
|---|---|
| `@capacitor/preferences` | Stockage persistant du token d'auth et des favoris |
| `@capacitor/push-notifications` | Notifications push natives via FCM (Android/iOS) |
| `@capacitor/splash-screen` | Splash screen natif (masquage manuel après init) |
| `@capacitor/network` | Détection de l'état de connexion |
| `@capacitor/dialog` | Dialogues natifs |
| `@capacitor-community/firebase-analytics` | Analytics Firebase natif |

### Workflow de build mobile

```bash
# 1. Générer le build SPA statique (SSR désactivé, URL API absolue)
#    et synchroniser avec les projets natifs Android & iOS
npm run mobile

# Détail des étapes de la commande ci-dessus :
#   npm run generate:mobile  → nuxt generate (SPA, API = prod)
#   npm run cap:sync         → npx cap sync (copie dans android/ et ios/)
```

### Ouvrir dans l'IDE natif

```bash
# Ouvrir le projet Android dans Android Studio
npm run cap:open
# Équivalent : npx cap open android

# Ouvrir le projet iOS dans Xcode
npx cap open ios
```

### Synchronisation seule (après modification du code web)

```bash
npx cap sync
# ou
npm run cap:sync
```

### Notes importantes

- En mode Capacitor, le SSR est désactivé (`NUXT_SSR=false`) — l'app tourne en SPA pur dans la WebView.
- Les appels API et Socket.io doivent pointer vers le serveur de production (URL absolue). C'est géré automatiquement par `generate:mobile`.
- Le CORS est configuré côté serveur pour accepter les requêtes depuis `http://localhost` (origine Capacitor).
- Le Splash Screen est géré **manuellement** (`launchAutoHide: false`) depuis le plugin `capacitor-auth.client.ts`.
- L'edge-to-edge est activé sur Android : le fond `#0B1120` remplit les barres système.

## ☁️ Déploiement Web (Render.com)

Le projet inclut un fichier `render.yaml` prêt à l'emploi :

```yaml
buildCommand: npm ci && npm run build
startCommand: npm run start   # node .output/server/index.mjs
healthCheckPath: /api/socket-status
httpPort: 3000
```

Les variables d'environnement sont à configurer dans le tableau de bord Render.

## 📂 Structure du projet

```
LiveStreamApp/
├── app/                  # Code source Vue/Nuxt
│   ├── pages/            # Routes (schedule, stream, results, favorites…)
│   ├── components/       # Composants UI, domaine, overlays
│   ├── composables/      # Logique réutilisable (socket, auth, refresh…)
│   ├── stores/           # État global Pinia (favorites, notifications, socket)
│   ├── services/         # Couche API client (public.service.ts, admin.service.ts)
│   ├── layouts/          # Layout principal avec nav et overlays
│   └── assets/css/       # Thème Tailwind + glassmorphism
├── server/               # Backend Nitro
│   ├── api/              # Routes API REST
│   ├── models/           # Modèles Mongoose
│   ├── plugins/          # Socket.io, scheduler temps réel
│   └── utils/            # Helpers, timings, cache
├── i18n/locales/         # Traductions (fr.json, de.json, ita.json)
├── android/              # Projet natif Android (Capacitor)
├── ios/                  # Projet natif iOS (Capacitor)
├── public/               # Assets statiques, icônes PWA, screenshots
├── capacitor.config.ts   # Configuration Capacitor
└── nuxt.config.ts        # Configuration Nuxt (SSR, PWA, i18n, plugins)
```

---

Développé avec ❤️ pour la **Coupe des Bains**.
