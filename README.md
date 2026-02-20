# 🏆 Coupe des Bains

**Coupe des Bains** est une plateforme moderne et performante conçue pour le suivi en temps réel d'événements sportifs. Développée avec **Nuxt 4**, elle offre une expérience fluide tant sur le web (PWA) que sur mobile (Android & iOS via Capacitor).

![Vue d'ensemble de l'application](./public/screenshots/home.png)

## 🚀 Technologies

L'application repose sur une stack technologique de pointe :

- **Frontend** : [Nuxt 4](https://nuxt.com/), [Tailwind CSS](https://tailwindcss.com/)
- **Mobile** : [Capacitor 8](https://capacitorjs.com/)
- **Temps Réel** : [Socket.io](https://socket.io/) (Scores et statuts en direct)
- **Base de données** : MongoDB via [Mongoose](https://mongoosejs.com/)
- **Gestion d'état** : [Pinia](https://pinia.vuejs.org/) avec persistance
- **PWA** : Support complet hors-ligne et notifications [Web Push](https://web-push-libs.org/)
- **Cartographie** : [Leaflet](https://leafletjs.com/) pour les plans de situation
- **Graphiques** : [Chart.js](https://www.chartjs.org/) pour l'historique des résultats
- **i18n** : Support multilingue (Français, Allemand, Italien)

## ✨ Fonctionnalités

- 📊 **Scores en Direct** : Mise à jour instantanée des résultats via WebSockets.
- 🎥 **Streaming** : Intégration de flux vidéo pour suivre les compétitions.
- 📅 **Programme** : Calendrier complet des passages et horaires.
- 🔔 **Notifications Push** : Alertes pour les favoris et les annonces importantes.
- 📱 **Expérience App-First** : PWA installable et applications natives Android/iOS.
- 🛠️ **Dashboard Admin** : Interface sécurisée pour la saisie des scores et la gestion des flux.
- 🗺️ **Plan Interactif** : Localisation des sites de compétition.

## 🛠️ Installation

### Prérequis

- Node.js (dernière version LTS recommandée)
- Un serveur MongoDB

### Configuration

Créez un fichier `.env` à la racine (ou configurez vos variables d'environnement) :

```env
# Backend & Sécurité
MONGODB_URI=votre_uri_mongodb
NUXT_ADMIN_PASSWORD=votre_mot_de_passe_admin

# Notifications Push (VAPID)
NUXT_VAPID_PRIVATE_KEY=votre_cle_privee
NUXT_PUBLIC_VAPID_PUBLIC_KEY=votre_cle_publique

# Public URLs
NUXT_PUBLIC_API_BASE=https://votre-api.com/api
NUXT_PUBLIC_SOCKET_URL=https://votre-api.com
```

### Lancement

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Construire pour la production
npm run build
```

## 📱 Déploiement Mobile (Capacitor)

L'application peut être compilée pour Android et iOS.

```bash
# Générer le build statique et synchroniser avec Capacitor
npm run mobile

# Ouvrir le projet dans Android Studio
npm run cap:open
```

## 📂 Structure du projet

- `app/` : Code source Vue/Nuxt (pages, composants, stores, composables).
- `server/` : Backend Nitro (API, modèles Mongoose, plugins Socket.io).
- `i18n/` : Fichiers de traduction (fr, de, ita).
- `android/` & `ios/` : Projets natifs Capacitor.
- `public/` : Assets statiques, icônes et manifestes PWA.

---

Développé avec ❤️ pour la **Coupe des Bains**.
