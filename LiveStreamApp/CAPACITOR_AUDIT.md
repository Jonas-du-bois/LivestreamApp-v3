# Audit de Migration Capacitor - LiveStreamApp

Ce document présente l'audit complet pour porter l'application **LiveStreamApp** sur les stores iOS et Android via Capacitor, tout en conservant une version Web PWA performante.

## 1. Architecture & Séparation (Nuxt 4.3 / Nitro)

Actuellement, l'application est "monolithique" (Frontend et Backend sur le même serveur). Pour une application mobile native (Capacitor), le code frontend doit être embarqué sur le téléphone, tandis que le backend (API) doit rester sur un serveur distant.

### Stratégie de Séparation
Sans diviser le dépôt de code, nous pouvons utiliser deux processus de build distincts :

1.  **Backend (API & Web PWA)** :
    *   **Commande** : `npm run build`
    *   **Déploiement** : VPS / Docker.
    *   **Rôle** : Sert l'API (`/api/...`), le Socket.io, et la version Web classique.

2.  **Application Mobile (Capacitor)** :
    *   **Commande** : `npm run generate` (SSG/SPA) avec configuration spécifique.
    *   **Rôle** : Génère un dossier `dist` (ou `.output/public`) contenant uniquement le Frontend statique. Ce dossier est copié dans le projet natif iOS/Android.
    *   **Configuration** : Le Frontend mobile doit savoir qu'il ne tourne pas sur `localhost` mais doit contacter votre serveur de prod.

### Actions Requises :
*   **Environment Config** : Ajouter une variable `NUXT_PUBLIC_API_BASE` dans `nuxt.config.ts`.
    *   En Web : `/api` (relatif).
    *   En Mobile : `https://mon-serveur-fsg.com/api` (absolu).
*   **Build Script** : Créer un script `build:mobile` qui force `ssr: false` et l'URL de l'API absolue.

---

## 2. Authentification (Cookies vs Tokens)

### État Actuel
*   Le Backend (`server/middleware/auth.ts`) vérifie l'en-tête `Authorization: Bearer <token>`. **C'est parfait.**
*   Le Frontend (`useApiClient.ts`) stocke le token dans un **Cookie** et l'injecte manuellement dans les headers.

### Le Problème
Les cookies sont instables sur Capacitor (problèmes de domaine `file://`, perte de session au redémarrage sur iOS).

### Solution Hybride (Recommandée)
Modifier `useApiClient.ts` pour utiliser une stratégie double :

1.  **Mode Web** : Continuer à utiliser `useCookie`.
2.  **Mode Mobile** : Utiliser `@capacitor/preferences` (Stockage natif sécurisé).

**Pseudo-code de la solution :**
```typescript
import { Preferences } from '@capacitor/preferences';

async function getToken() {
  if (isPlatform('capacitor')) {
    const { value } = await Preferences.get({ key: 'auth_token' });
    return value;
  }
  return useCookie('auth_token').value;
}
```

---

## 3. Notifications Push (Web vs Natif)

### État Actuel
*   Utilisation de la norme **Web Push** (`web-push` sur Node.js + Service Worker).
*   Modèle de base de données `Subscription` strict (`endpoint`, `keys`).

### Le Problème
Sur iOS (Capacitor), le Web Push est limité. La norme industrielle est **FCM (Firebase Cloud Messaging)**.

### Solution Hybride
Il faut supporter deux "canaux" de notification en parallèle.

1.  **Base de Données (`Subscription.ts`)** :
    *   Ajouter un champ `type`: `'web' | 'fcm'`.
    *   Rendre `keys` optionnel (FCM n'utilise qu'un `token`).

2.  **Scheduler (`server/plugins/scheduler.ts`)** :
    *   Diviser la logique d'envoi :
        *   Si `type === 'web'` -> Utiliser `web-push` (Code actuel).
        *   Si `type === 'fcm'` -> Utiliser `firebase-admin` SDK.

3.  **Frontend** :
    *   Web : Garder le Service Worker actuel.
    *   Mobile : Installer `@capacitor/push-notifications` et `@capacitor-community/fcm`.

---

## 4. YouTube & Liens Externes

Vous avez indiqué que les liens de stream changent et que le lecteur natif n'est pas requis.
*   **Recommendation** : Utiliser le plugin `@capacitor/browser` ou simplement des `iframe` standards.
*   **Attention** : Sur iOS, les iframes doivent être autorisées dans le `Info.plist` (App Transport Security) si les liens ne sont pas HTTPS (rare aujourd'hui).

---

## 5. Roadmap Technique

Voici les étapes concrètes pour réaliser la migration :

### Phase 1 : Préparation du Code (Audit validé)
1.  Installer `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`.
2.  Initialiser Capacitor : `npx cap init`.

### Phase 2 : Refactoring Frontend
1.  Adapter `useApiClient.ts` (Auth Hybride).
2.  Adapter `nuxt.config.ts` pour gérer les URLs d'API absolues en mode mobile.
3.  Vérifier que le `router` fonctionne bien en mode hash ou history (Capacitor supporte history mais nécessite une config serveur si on rafraîchit, ce qui n'arrive pas en app native, donc ok).

### Phase 3 : Notifications
1.  Configurer Firebase Console (créer projet, récupérer `google-services.json`).
2.  Modifier le Backend (Schema + Scheduler).
3.  Intégrer le plugin Push Capacitor dans le code Vue (`app.vue` ou plugin client).

### Phase 4 : Build & Test
1.  `npm run generate`.
2.  `npx cap sync`.
3.  Ouvrir Xcode / Android Studio et compiler.

## Conclusion
Le code est **hautement compatible** grâce à l'architecture API-first (Nitro) et l'usage de `useFetch/$fetch`.
La seule "dette technique" à traiter est la gestion du token d'auth et l'adaptation du modèle de notifications.

**Temps estimé pour la mise en place technique (hors validation stores) : 2-3 jours.**
