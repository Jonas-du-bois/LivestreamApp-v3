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

## 2026-02-22: Vue Imports Cleanup & SSR Safety

- **Target:**
  - `app/pages/index.vue`
  - `app/pages/photos.vue`
  - `app/pages/food.vue`
  - `app/composables/useFirstLoad.ts`
  - `app/composables/useNow.ts`
  - `app/composables/usePartyCountdown.ts`
  - `app/composables/useNetworkStatus.ts`
  - `app/composables/useFlickrPhotos.ts`
  - `app/composables/useApiClient.ts`
  - `app/components/home/HomeHeroCarousel.vue`
  - `app/components/AnimatedCounter.vue`
  - `app/stores/socket.ts`
- **Risks Mitigated:**
    - **Fragility / Code Noise:** Explicit imports of Nuxt's auto-imported Vue primitives (`ref`, `computed`, `onMounted`, etc.) create unnecessary clutter and deviate from Nuxt 4 best practices.
    - **SSR Crashes:** Using `typeof window === 'undefined'` in `useNetworkStatus.ts` is less robust than Nuxt's built-in `import.meta.client` for client-side checks, which could lead to hydration mismatches or server-side execution errors in some edge cases.
- **Solution:**
    - Systematically removed all explicit manual imports of Vue composition API functions across multiple pages, components, composables, and stores.
    - Updated `useFirstLoad.ts` to only import `type Ref`.
    - Updated `useNetworkStatus.ts` to use `import.meta.client` for SSR-safe window access.
    - *Règle respectée :* "Toujours utiliser import.meta.client avant d'accéder à window" et "Supprimer les imports inutiles (Nuxt auto-importe ref, computed, onMounted, etc.)."
