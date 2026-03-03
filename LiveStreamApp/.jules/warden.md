# 🛡️ Warden Log

Journal de bord de l'agent Warden.
Suivi des refactorisations, sécurisations et améliorations de qualité de code.

## Sécurisation de LiveStreamApp/app/pages/index.vue

**Cible :** `app/pages/index.vue`

**Problèmes identifiés :**
*   Utilisation extensive de `any` dans les computed properties (`happeningNow`, `firstLivePassage`, `firstLiveStream`).
*   Typage faible du timer `autoRefreshTimer` (`any`).
*   Risque de fuite de mémoire (cleanup incomplet de `setInterval`).
*   Code mort/bugué dans `heroSubtitle` (calculait des valeurs mais retournait une string statique vide).

**Actions correctives :**
*   🛡️ **Typage Strict :** Remplacement de `any` par `PassageEnriched`, `Stream`, `Passage` importés depuis `~/types/api`.
*   🛡️ **Cycle de vie :** Typage correct de `autoRefreshTimer` (`ReturnType<typeof setInterval> | null`) et nettoyage robuste dans `onUnmounted`.
*   🐛 **Bugfix :** Correction de `heroSubtitle` pour afficher correctement la localisation et l'agrès.
*   🔒 **Sécurité :** Vérification stricte des propriétés imbriquées (`s.currentPassage` peut être string ou objet) et ajout de l'optional chaining (`?.`) pour la résilience runtime face aux données partielles.

**Règle appliquée :**
> "Toujours typer strictement les timers et nettoyer les intervalles dans onUnmounted pour éviter les fuites de mémoire."

## Sécurisation de LiveStreamApp/app/pages/schedule.vue et useRealtimeStatus

**Cible :** `app/pages/schedule.vue` et `app/composables/useRealtimeStatus.ts`

**Problèmes identifiés :**
*   Utilisation de `any` dans `schedule.vue` pour typer les éléments de `scheduleResponse` dans une computed property.
*   Risque de fuite de mémoire dans `useRealtimeStatus.ts` : le timer `deferTimer` n'était pas nettoyé lors du démontage du composant parent.

**Actions correctives :**
*   🛡️ **Typage Strict :** Suppression du cast `(item: any)` dans `schedule.vue`. TypeScript infère désormais correctement le type `PassageEnriched`.
*   🛡️ **Cycle de vie :** Ajout de `onUnmounted` dans `useRealtimeStatus.ts` pour nettoyer systématiquement `deferTimer` via `clearTimeout`.

**Règle appliquée :**
> "Bannir `any` pour garantir la sécurité du typage et toujours nettoyer les timers (setTimeout/setInterval) dans `onUnmounted`."

## Sécurisation de useNetworkStatus, HomeHeroCarousel, et FilterChips

**Cible :** `app/composables/useNetworkStatus.ts`, `app/components/home/HomeHeroCarousel.vue`, `app/components/ui/FilterChips.vue`

**Problèmes identifiés :**
*   Utilisation de `any` dans `useNetworkStatus.ts` pour accéder aux propriétés non standards de l'API `NetworkInformation` (`connection`, `mozConnection`, `webkitConnection`) sur l'objet `navigator`.
*   Utilisation de `any` dans `HomeHeroCarousel.vue` pour typer un intervalle (`rotationInterval`) et un tableau d'éléments du carousel (`items`).
*   Utilisation de `any` dans `FilterChips.vue` pour autoriser des propriétés additionnelles sur l'interface `FilterItem`.

**Actions correctives :**
*   🛡️ **Typage Strict (`useNetworkStatus.ts`) :** Création d'une interface `NetworkInformation` et d'une fonction `getConnection()` avec un cast sécurisé (`unknown` puis interface) pour éliminer les `any`.
*   🛡️ **Typage Strict (`HomeHeroCarousel.vue`) :** Typage de `rotationInterval` avec `ReturnType<typeof setInterval> | null` et création de l'interface `CarouselItem` pour typer strictement le tableau `items`. Vérification que `stopRotation()` est bien appelé dans `onUnmounted`.
*   🛡️ **Typage Strict (`FilterChips.vue`) :** Remplacement de `[key: string]: any` par `[key: string]: unknown` dans l'interface `FilterItem`.

**Règle appliquée :**
> "Remplacer l'utilisation de `any` pour interagir avec des APIs natives non standard ou externes par des interfaces dédiées. Typer strictement les retours de setInterval/setTimeout."

## Sécurisation de useNetworkStatus et socket.client

**Cible :** `app/composables/useNetworkStatus.ts`, `app/plugins/socket.client.ts`

**Problèmes identifiés :**
*   Utilisation explicite des auto-imports Nuxt (`ref`, `onMounted`, `onUnmounted`) dans `useNetworkStatus.ts`, violant les bonnes pratiques Nuxt 4.
*   Utilisation directe de `typeof window === 'undefined'` ou `typeof document !== 'undefined'` au lieu de `import.meta.client` pour les guards SSR.
*   Risque potentiel de plantage SSR (Hydration Mismatch ou accès prématuré aux API navigateur) en n'utilisant pas la variable d'environnement Nuxt certifiée `import.meta.client`.

**Actions correctives :**
*   🛡️ **Nettoyage :** Suppression de la ligne `import { ref, onMounted, onUnmounted } from 'vue'` dans `useNetworkStatus.ts`.
*   🛡️ **Compatibilité SSR :** Remplacement des vérifications globales (`typeof window`, `typeof document`, `typeof navigator`) par le guard strict `if (!import.meta.client) return` dans les deux fichiers.

**Règle appliquée :**
> "Toujours utiliser `import.meta.client` avant d'accéder à `window`, `document` ou `navigator` dans un environnement SSR. Éliminer le bruit des imports redondants gérés par Nuxt."
